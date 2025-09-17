import type { Allowed } from '@/infra/storage/cloudflare/CloudFlareFileService'
import type { FileService } from '@/infra/storage/file-service'
import type { PrismaClient } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import { auth } from '../../middlewares/auth'
import { z } from 'zod'
import { OpenAIClientRegistry } from '@/infra/openai/OpenAIClientRegistry'
import { toFile } from 'openai/uploads'

type Resources = {
	fileService: FileService<Allowed>
	prisma: PrismaClient
	openaiRegistry: OpenAIClientRegistry
}

const log = (...args: unknown[]) => {
	try {
		// eslint-disable-next-line no-console
		console.log('[FilesUpload]', ...args)
	} catch {}
}

type JsonBuffer = { type: 'Buffer'; data: number[] }
const isJsonBuffer = (x: unknown): x is JsonBuffer =>
	typeof x === 'object' &&
	x !== null &&
	(x as { type?: unknown }).type === 'Buffer' &&
	Array.isArray((x as { data?: unknown }).data)

const toNodeBuffer = (v: unknown): Buffer => {
	if (Buffer.isBuffer(v)) return v
	if (v && typeof v === 'object' && ArrayBuffer.isView(v)) {
		const u8 = v as Uint8Array
		return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength)
	}
	if (v instanceof ArrayBuffer) return Buffer.from(v)
	if (isJsonBuffer(v)) return Buffer.from(v.data)
	if (typeof v === 'string') {
		try {
			return Buffer.from(v, 'base64')
		} catch {}
	}
	throw new Error('Expected Buffer-like value')
}

type UploadedFile = {
	buffer: Buffer
	filename: string
	mimetype: string
	encoding: string
}

export async function uploadFiles(app: FastifyInstance, resources: Resources) {
	app.register(auth).post('/api/tenant/:cnpj/files', {
		schema: {
			tags: ['internal-upload'],
			summary: 'Upload files',
			params: z.object({ cnpj: z.string().min(1) }),
			// validação flexível do body para não descartar campos do arquivo
			body: z.object({ files: z.array(z.any()).min(1) }),
			response: {
				200: z.object({
					files: z.array(z.object({ id: z.string(), name: z.string() })),
				}),
				400: z.object({
					error: z.object({
						code: z.string(),
						message: z.string(),
						hint: z.string().optional(),
						details: z.any().optional(),
					}),
				}),
				415: z.object({
					error: z.object({
						code: z.string(),
						message: z.string(),
						hint: z.string().optional(),
						details: z.array(z.string()).optional(),
					}),
				}),
			},
			consumes: ['multipart/form-data'],
		},
		attachValidation: true,
		preValidation: async req => {
			if (!req.isMultipart?.()) {
				log('Invalid content-type for upload', req.headers['content-type'])
				return
			}
			const body = (req.body ?? {}) as Record<string, unknown>
			log('preValidation: body keys', Object.keys(body))
			const ensureBuffer = async (
				f: { buffer?: unknown; toBuffer?: () => Promise<Buffer> } | undefined
			) => {
				if (!f) return undefined
				if (
					typeof f.buffer === 'undefined' &&
					typeof f.toBuffer === 'function'
				) {
					const buf = await f.toBuffer()
					log(
						'toBuffer() used to hydrate file; size',
						(buf as Buffer | undefined)?.byteLength
					)
					return { ...(f as object), buffer: buf }
				}
				if (f.buffer && !Buffer.isBuffer(f.buffer)) {
					try {
						const buf = toNodeBuffer(f.buffer)
						log(
							'Converted buffer-like to Buffer; size',
							(buf as Buffer | undefined)?.byteLength
						)
						return { ...(f as object), buffer: buf }
					} catch {}
				}
				return f
			}
			const files: unknown[] = []
			// case 1: files array
			if (Array.isArray((body as { files?: unknown[] }).files)) {
				for (const x of (body as { files: unknown[] }).files) {
					const v = await ensureBuffer(x as any)
					if (v) files.push(v)
				}
			}
			// case 2: single file field -> wrap in array
			if ((body as { file?: unknown }).file) {
				const v = await ensureBuffer((body as { file: unknown }).file as any)
				if (v) files.push(v)
			}
			// case 3: file0, file1, ...
			for (const [k, v] of Object.entries(body)) {
				if (/^file\d+$/.test(k)) {
					const e = await ensureBuffer(v as any)
					if (e) files.push(e)
				}
			}
			if (files.length) {
				;(req as unknown as { body: unknown }).body = { files }
				log(
					'preValidation: normalized files',
					(files as Array<any>).map((f, i) => ({
						idx: i,
						filename: (f as any)?.filename,
						mimetype: (f as any)?.mimetype,
						size: (f as any)?.buffer?.byteLength,
					}))
				)
			}
		},
		handler: async (req, reply) => {
			// Ignora divergências do validator (form-data vs. objeto hidratado)
			void req.validationError
			const { cnpj } = req.params as { cnpj: string }
			log('handler:start', { cnpj })
			const { tenant } = await req.getAdminMembership(cnpj)
			const { files } = req.body as { files: UploadedFile[] }
			log(
				'handler:received files',
				files.map((f, i) => ({
					idx: i,
					filename: f.filename,
					mimetype: f.mimetype,
					size: f.buffer?.byteLength,
				}))
			)

			const invalid = files.filter(
				f => !resources.fileService.validateMediaType(f.mimetype)
			)
			if (invalid.length) {
				log(
					'handler:invalid files',
					invalid.map((f, i) => ({
						idx: i,
						filename: f.filename,
						mimetype: f.mimetype,
					}))
				)
				return reply.status(415).send({
					error: {
						code: 'UNSUPPORTED_MEDIA_TYPE',
						message: 'Um ou mais arquivos possuem tipo não suportado.',
						hint: 'Envie arquivos com tipos MIME permitidos (ex.: application/pdf).',
						details: invalid.map(f => f.filename),
					},
				})
			}

			const createdOut: Array<{ id: string; name: string }> = []
			const createdRecords: Array<{
				dbId: string
				key: string
				openaiFileId: string
			}> = []
			try {
				// Prepare OpenAI client and tenant vector store (once per request)
				const vsm =
					await resources.openaiRegistry.getVectorStoreManagerForTenant(
						tenant.id
					)
				const storeId = await vsm.ensureVectorStoreForTenant(tenant.id)
				const openai = await resources.openaiRegistry.getClientForTenant(
					tenant.id
				)

				for (const file of files) {
					let dbId: string | null = null
					let key: string | null = null
					let openaiFileId: string | null = null
					try {
						log('saving to storage', {
							filename: file.filename,
							mime: file.mimetype,
							size: file.buffer?.byteLength,
						})
						const saved = await resources.fileService.save(
							{
								kind: 'buffer',
								data: file.buffer,
								mimetype: file.mimetype as unknown as Allowed,
								size: file.buffer.byteLength,
								filename: file.filename,
							},
							tenant.id
						)
						key = saved.key ?? `${tenant.id}--${saved.id}`
						log('saved to storage', {
							filename: file.filename,
							key,
							id: saved.id,
						})
						const db = await resources.prisma.file.create({
							data: {
								tenantId: tenant.id,
								key,
								name: file.filename,
								contentType: file.mimetype,
							},
						})
						dbId = db.id
						log('db row created', {
							id: db.id,
							key,
							filename: file.filename,
						})

						// Index in OpenAI Vector Store (mandatory)
						const uploadable = await toFile(file.buffer, file.filename, {
							type: file.mimetype,
						})
						const createdFile = await openai.files.create({
							file: uploadable,
							purpose: 'assistants',
						})
						openaiFileId = createdFile.id
						await openai.vectorStores.files.create(storeId, {
							file_id: createdFile.id,
						})
						await resources.prisma.file.update({
							where: { id: db.id },
							data: {
								indexInStorage: createdFile.id,
								meta: { vectorStoreId: storeId },
							},
						})
						createdOut.push({ id: db.id, name: file.filename })
						createdRecords.push({
							dbId: db.id,
							key,
							openaiFileId: createdFile.id,
						})
					} catch (e) {
						// Cleanup partial resources for this file
						try {
							if (openaiFileId) {
								try {
									await openai.vectorStores.files.delete(openaiFileId, {
										vector_store_id: storeId,
									})
								} catch {}
								try {
									await openai.files.delete(openaiFileId)
								} catch {}
							}
						} catch {}
						try {
							if (key) await resources.fileService.removeByKey(key, tenant.id)
						} catch {}
						try {
							if (dbId)
								await resources.prisma.file.delete({
									where: { id: dbId },
								})
						} catch {}
						throw e
					}
				}

				log('handler:success', { count: createdOut.length })
				return reply.code(200).send({ files: createdOut })
			} catch (err) {
				// Best-effort rollback of any previous successfully created records
				try {
					const vsm =
						await resources.openaiRegistry.getVectorStoreManagerForTenant(
							tenant.id
						)
					const storeId = await vsm.ensureVectorStoreForTenant(tenant.id)
					const openai = await resources.openaiRegistry.getClientForTenant(
						tenant.id
					)

					// Rollback previously successful creations to keep request atomic
					for (const rec of createdRecords) {
						try {
							if (rec.openaiFileId) {
								try {
									await openai.vectorStores.files.delete(rec.openaiFileId, {
										vector_store_id: storeId,
									})
								} catch {}
								try {
									await openai.files.delete(rec.openaiFileId)
								} catch {}
							}
						} catch {}
						try {
							if (rec.key)
								await resources.fileService.removeByKey(rec.key, tenant.id)
						} catch {}
						try {
							await resources.prisma.file.delete({
								where: { id: rec.dbId },
							})
						} catch {}
					}
				} catch {}

				// eslint-disable-next-line no-console
				console.error('[FilesUpload] handler:error', err)
				return reply.code(400).send({
					error: {
						code: 'UPLOAD_FAILED',
						message: 'Falha ao salvar e indexar arquivo no Vector Store.',
						hint: 'Tente novamente mais tarde. Se persistir, verifique a configuração do OpenAI do tenant.',
						details: (err as unknown) ?? undefined,
					},
				})
			}
		},
	})
}
