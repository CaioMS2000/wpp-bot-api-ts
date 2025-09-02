import { FileService } from '@/infra/storage/file-service'
import { Allowed as LocalFileServiceAllowedMedia } from '@/infra/storage/local/local-file-service'
import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	fileService: FileService<LocalFileServiceAllowedMedia>
}

// Helper reutilizável (coloque perto do schema)
const toNodeBuffer = (v: unknown): Buffer => {
	if (Buffer.isBuffer(v)) return v

	if (v && typeof v === 'object' && ArrayBuffer.isView(v)) {
		const u8 = v as Uint8Array
		return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength)
	}

	if (v instanceof ArrayBuffer) {
		return Buffer.from(v as ArrayBuffer)
	}

	if (
		v &&
		typeof v === 'object' &&
		(v as any).type === 'Buffer' &&
		Array.isArray((v as any).data)
	) {
		return Buffer.from((v as any).data)
	}

	if (typeof v === 'string') {
		try {
			return Buffer.from(v, 'base64')
		} catch {}
	}

	throw new Error('Expected Buffer-like value')
}

const uploadedFileSchema = z.object({
	buffer: z.any().transform(toNodeBuffer),
	filename: z.string(),
	mimetype: z.string(),
	encoding: z.string(),
})

const fileDataSchema = z.object({
	file: uploadedFileSchema,
	tags: z.array(z.string()),
	instruction: z.string(),
})

const bodySchema = z.object({
	filesData: z.array(fileDataSchema).min(1),
})

const paramsSchema = z.object({
	cnpj: z.string().min(1),
})

const replySchema = {
	200: z.object({
		files: z.array(
			z.object({
				name: z.string(),
				id: z.string(),
			})
		),
	}),
}

export async function uploadFiles(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post(
			'/api/company/:cnpj/files',
			{
				schema: {
					params: paramsSchema,
					body: bodySchema,
					response: replySchema,
					consumes: ['multipart/form-data'],
				},
				preValidation: async req => {
					if (!req.isMultipart?.()) {
						return
					}

					const body = (req.body ?? {}) as Record<string, any>

					const looksJson = (s: string) => {
						const t = s.trim()
						return (
							(t.startsWith('{') && t.endsWith('}')) ||
							(t.startsWith('[') && t.endsWith(']'))
						)
					}

					const safeParse = (s: string) => {
						try {
							return JSON.parse(s)
						} catch (err) {
							return undefined
						}
					}

					const getFieldValue = (v: unknown): string | undefined => {
						if (typeof v === 'string') return v
						if (v && typeof v === 'object' && 'value' in (v as any)) {
							const raw = (v as any).value
							if (typeof raw === 'string') return raw
							if (raw != null) return String(raw)
						}
						return undefined
					}

					const hydrateBuffersOnBody = async () => {
						const files = (req.body as any)?.filesData ?? []
						if (!Array.isArray(files)) return
						for (const entry of files) {
							const f = entry?.file
							if (!f) continue
							if (
								typeof f.buffer === 'undefined' &&
								typeof f.toBuffer === 'function'
							) {
								entry.file.buffer = await f.toBuffer()
							}
							if (f?.buffer && !Buffer.isBuffer(f.buffer)) {
								try {
									entry.file.buffer = toNodeBuffer(f.buffer)
								} catch {}
							}
						}
					}

					{
						const asString = getFieldValue(body.filesData)
						if (asString && looksJson(asString)) {
							const meta = safeParse(asString)
							if (meta) {
								const arr = Array.isArray(meta) ? meta : [meta]
								req.body = {
									filesData: arr.map((m, i) => ({
										instruction: String(m?.instruction ?? ''),
										tags: Array.isArray(m?.tags)
											? m.tags.map((t: any) => String(t))
											: m?.tags != null
												? [String(m.tags)]
												: [],
										file: (body as any)[`file${i}`],
									})),
								}

								await hydrateBuffersOnBody()
								return
							}
						}
					}

					if (Array.isArray(body.filesData)) {
						const parsed: any[] = []
						for (const x of body.filesData) {
							const s = getFieldValue(x)
							if (s && looksJson(s)) {
								const v = safeParse(s)
								if (v !== undefined)
									parsed.push(...(Array.isArray(v) ? v : [v]))
							}
						}
						if (parsed.length) {
							req.body = {
								filesData: parsed.map((m, i) => ({
									instruction: String(m?.instruction ?? ''),
									tags: Array.isArray(m?.tags)
										? m.tags.map((t: any) => String(t))
										: m?.tags != null
											? [String(m.tags)]
											: [],
									file: (body as any)[`file${i}`],
								})),
							}

							await hydrateBuffersOnBody()
							return
						}
					}

					const re = /^filesData\[(\d+)\]\[(file|instruction|tags)\](\[\])?$/
					const bracketKeys = Object.keys(body ?? {}).filter(k => re.test(k))

					const buckets = new Map<
						number,
						{ instruction?: string; tags: string[] }
					>()
					for (const [key, rawVal] of Object.entries(body)) {
						const m = key.match(re)
						if (!m) continue
						const idx = Number(m[1])
						const field = m[2] as 'instruction' | 'tags' | 'file'
						const b = buckets.get(idx) ?? { tags: [] }

						const val =
							getFieldValue(rawVal) ??
							(Array.isArray(rawVal)
								? rawVal
										.map(getFieldValue)
										.filter((s): s is string => typeof s === 'string')
								: undefined)

						if (field === 'instruction') {
							if (typeof val === 'string') b.instruction = val
						}
						if (field === 'tags') {
							if (Array.isArray(val)) b.tags.push(...val)
							else if (typeof val === 'string' && val.trim() !== '')
								b.tags.push(val)
						}
						buckets.set(idx, b)
					}

					if (buckets.size) {
						const filesData = [...buckets.entries()]
							.sort(([a], [b]) => a - b)
							.map(([idx, m]) => ({
								instruction: m.instruction ?? '',
								tags: m.tags,
								file: (body as any)[`file${idx}`],
							}))

						req.body = { filesData }

						await hydrateBuffersOnBody()
					}

					await hydrateBuffersOnBody()
				},
			},
			async (req, reply) => {
				const { cnpj } = req.params as z.infer<typeof paramsSchema>
				const { company } = await req.getUserMembership(cnpj)
				const { filesData } = req.body as z.infer<typeof bodySchema>
				const saved = (
					await Promise.all(
						filesData.map(d => {
							if (resources.fileService.validateMediaType(d.file.mimetype)) {
								return resources.fileService.save(
									{
										data: d.file.buffer,
										kind: 'buffer',
										mimetype: d.file.mimetype,
										size: d.file.buffer.byteLength,
										filename: d.file.filename,
									},
									{
										meta: { tags: d.tags, instruction: d.instruction },
										tenantId: company.id,
									},
									company.id
								)
							}
						})
					)
				).filter(data => data !== undefined)

				return reply
					.code(200)
					.send({ files: saved.map(s => ({ id: s.id, name: s.filename })) })
			}
		)
}

export default uploadFiles
