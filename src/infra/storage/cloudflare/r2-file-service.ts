import { createHash, randomUUID } from 'node:crypto'
import { Readable } from 'node:stream'
import { BaseFile as _BaseFile, FileType as _FileType } from '@/@types'
import { env } from '@/config/env'
import { r2 } from '@/lib/cloudflare'
import { openAIClient } from '@/lib/openai'
import { prisma } from '@/lib/prisma'
import { logger } from '@/logger'
import { sanitize } from '@/utils/text'
import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
} from '@aws-sdk/client-s3'
import { Company } from '@prisma/client'
import { fileTypeFromBuffer } from 'file-type'
import { toFile } from 'openai'
import {
	BufferReturn,
	FileInput,
	FileMetaInput,
	FileService,
	StreamReturn,
} from '../file-service'
import { metaSchema } from '../schema'

export const DocMimes = ['application/pdf'] as const
export const AllowedMedia = [...DocMimes] as const
export type Allowed = (typeof AllowedMedia)[number]
type FileType = _FileType<Allowed>
type BaseFile = _BaseFile<Allowed>

function asNodeReadable(body: unknown): Readable {
	if (!body) throw new Error('Objeto sem conteúdo (Body ausente)')

	if (body instanceof Readable) return body

	if (typeof (body as any)?.getReader === 'function') {
		const readableStream = body as any
		const fromWeb = (Readable as any).fromWeb
		if (typeof fromWeb === 'function') {
			return fromWeb(readableStream)
		}

		return Readable.from(
			(async function* () {
				const reader = readableStream.getReader()
				try {
					while (true) {
						const { value, done } = await reader.read()
						if (done) break
						yield Buffer.isBuffer(value) ? value : Buffer.from(value)
					}
				} finally {
					reader.releaseLock?.()
				}
			})()
		)
	}

	if (typeof (body as any)?.stream === 'function') {
		const webStream = (body as any).stream()
		const fromWeb = (Readable as any).fromWeb
		if (typeof fromWeb === 'function') return fromWeb(webStream)

		return Readable.from(
			(async function* () {
				const ab = await (body as Blob).arrayBuffer()
				yield Buffer.from(ab)
			})()
		)
	}

	if (Buffer.isBuffer(body)) return Readable.from(body)
	if (body instanceof Uint8Array) return Readable.from(Buffer.from(body))

	throw new Error('Tipo de Body não suportado')
}

export class R2FileService extends FileService<Allowed> {
	protected readonly accepts = AllowedMedia

	constructor() {
		super(AllowedMedia)
	}

	private async resolveOpenAIStore(companyId: string): Promise<string> {
		try {
			const company = await prisma.company.findUniqueOrThrow({
				where: { id: companyId },
			})

			if (company.storageId) {
				return company.storageId
			}

			const store = await openAIClient.vectorStores.create({
				name: `${company.name}-${company.cnpj}`,
				metadata: { tenant_id: company.id },
			})

			await prisma.company.update({
				where: { id: companyId },
				data: { storageId: store.id },
			})

			return store.id
		} catch (error) {
			logger.error(error)
			throw error
		}
	}

	validateMediaType(mt: string): mt is Allowed {
		return AllowedMedia.includes(mt as any)
	}

	async save(
		inputFile: FileInput<Allowed>,
		fileMeta: FileMetaInput,
		companyId: string
	): Promise<FileType> {
		if (inputFile.kind !== 'buffer') {
			throw new Error('Stream is not supported yet')
		}

		const isAllowedMimetype = this.validateMediaType(inputFile.mimetype)

		if (!isAllowedMimetype) {
			throw new Error(`MIME não permitido: ${inputFile.mimetype}`)
		}

		const buf = Buffer.isBuffer(inputFile.data)
			? inputFile.data
			: Buffer.from(inputFile.data)
		const detected = await fileTypeFromBuffer(buf)

		if (!detected)
			throw new Error('Não foi possível detectar o tipo real do arquivo')

		if (!this.validateMediaType(detected.mime)) {
			throw new Error(`Tipo real não permitido: ${detected.mime}`)
		}

		if (fileMeta.declaredMime && fileMeta.declaredMime !== detected.mime) {
			throw new Error(
				`Divergência de MIME: declarado=${fileMeta.declaredMime}, real=${detected.mime}`
			)
		}

		const uuid = randomUUID()
		const humanName = sanitize(inputFile.filename)
		const key = `${companyId}--${uuid}.${detected.ext}`
		const checksum = createHash('sha256').update(buf).digest('hex')

		try {
			const command = new PutObjectCommand({
				Bucket: env.AWS_BUCKET_NAME,
				Key: key,
				Body: buf,
				ContentType: detected.mime,
				Metadata: {
					sha256: checksum,
					filename: encodeURIComponent(inputFile.filename),
				},
				ContentLength: buf.length,
			})

			await r2.send(command)

			const parsedMeta = JSON.parse(JSON.stringify(fileMeta.meta))
			const storeId = await this.resolveOpenAIStore(companyId)
			const uploaded = await openAIClient.files.create({
				file: await toFile(buf, inputFile.filename, {
					type: detected.mime,
				}),
				purpose: 'assistants',
			})
			const tagEntries = fileMeta.meta.tags.slice(0, 14).map(raw => {
				const t = String(raw)
					.toLowerCase()
					.replace(/[^\w\-]+/g, '_')
					.slice(0, 60)
				return [`tag_${t}`, true] as const
			})
			const inStoreFile = await openAIClient.vectorStores.files.create(
				storeId,
				{
					file_id: uploaded.id,
					attributes: {
						...Object.fromEntries(tagEntries),
						usage: fileMeta.meta.instruction.slice(0, 512),
					},
				}
			)
			const newFile = await prisma.file.create({
				data: {
					contentType: detected.mime,
					key,
					name: humanName,
					company: { connect: { id: companyId } },
					meta: parsedMeta,
					indexInStorage: uploaded.id,
				},
			})
			const saved: FileType = {
				id: newFile.id,
				key,
				createdAt: newFile.createdAt,
				size: buf.byteLength,
				mime: detected.mime,
				checksum,
				filename: inputFile.filename,
				meta: {
					...fileMeta.meta,
					indexInStorage: uploaded.id,
					storageId: storeId,
				},
			}

			return saved
		} catch (e) {
			await r2.send(
				new DeleteObjectCommand({ Bucket: env.AWS_BUCKET_NAME, Key: key })
			)
			throw e
		}
	}

	private async readStream(
		key: string,
		companyId: string
	): Promise<StreamReturn<Allowed>> {
		const db = await prisma.file.findUnique({
			where: { key },
		})
		const company = (await prisma.company.findFirstOrThrow({
			where: { id: companyId, storageId: { not: null } },
		})) as { storageId: string } & Company

		if (!db || db.companyId !== companyId) {
			throw new Error('Arquivo não encontrado')
		}

		const get = await r2.send(
			new GetObjectCommand({
				Bucket: env.AWS_BUCKET_NAME,
				Key: key,
			})
		)

		if (!get.Body) {
			throw new Error('Objeto sem conteúdo (Body ausente)')
		}

		const size = Number(get.ContentLength ?? 0)
		const objectMime = (db.contentType ??
			get.ContentType ??
			'application/octet-stream') as Allowed

		if (!this.validateMediaType(objectMime)) {
			throw new Error(`Arquivo salvo com MIME não aceito: ${objectMime}`)
		}

		const metaFilename = get.Metadata?.filename
			? decodeURIComponent(get.Metadata.filename)
			: undefined
		const filename = metaFilename || db.name || key
		const createdAt =
			db.createdAt ??
			(get.LastModified ? new Date(get.LastModified) : new Date())
		const id = db.id ?? key.slice(companyId.length + 2).split('.')[0]
		const stream = asNodeReadable(get.Body)

		return {
			id,
			key,
			createdAt,
			size,
			mime: objectMime,
			filename,
			stream,
			meta: {
				...metaSchema.parse(db.meta),
				indexInStorage: db.indexInStorage,
				storageId: company.storageId,
			},
		}
	}

	private async readBuffer(
		key: string,
		companyId: string
	): Promise<BufferReturn<Allowed>> {
		const db = await prisma.file.findUnique({
			where: { key },
		})
		const company = (await prisma.company.findFirstOrThrow({
			where: { id: companyId, storageId: { not: null } },
		})) as { storageId: string } & Company

		if (!db || db.companyId !== companyId) {
			throw new Error('Arquivo não encontrado')
		}

		const get = await r2.send(
			new GetObjectCommand({
				Bucket: env.AWS_BUCKET_NAME,
				Key: key,
			})
		)

		if (!get.Body) {
			throw new Error('Objeto sem conteúdo (Body ausente)')
		}

		const chunks: Buffer[] = []

		await new Promise<void>((resolve, reject) => {
			const readable = asNodeReadable(get.Body)
			readable
				.on('data', c => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
				.on('end', resolve)
				.on('error', reject)
		})

		const buffer = Buffer.concat(chunks)
		const objectMime = (db.contentType ??
			get.ContentType ??
			'application/octet-stream') as Allowed

		if (!this.validateMediaType(objectMime)) {
			throw new Error(`Arquivo salvo com MIME não aceito: ${objectMime}`)
		}

		const metaFilename = get.Metadata?.filename
			? decodeURIComponent(get.Metadata.filename)
			: undefined
		const filename = metaFilename || db.name || key
		const createdAt =
			db.createdAt ??
			(get.LastModified ? new Date(get.LastModified) : new Date())

		const checksum =
			get.Metadata?.sha256 ?? createHash('sha256').update(buffer).digest('hex')
		const id = db.id ?? key.slice(companyId.length + 2).split('.')[0]

		return {
			id,
			key,
			createdAt,
			size: buffer.byteLength,
			mime: objectMime,
			filename,
			checksum,
			buffer,
			meta: {
				...metaSchema.parse(db.meta),
				indexInStorage: db.indexInStorage,
				storageId: company.storageId,
			},
		}
	}

	async read(key: string, companyId: string): Promise<BufferReturn<Allowed>>
	async read(
		key: string,
		companyId: string,
		config: { mode: 'buffer' }
	): Promise<BufferReturn<Allowed>>
	async read(
		key: string,
		companyId: string,
		config: { mode: 'stream' }
	): Promise<StreamReturn<Allowed>>
	async read(
		key: string,
		companyId: string,
		config?: { mode: 'stream' | 'buffer' }
	): Promise<StreamReturn<Allowed> | BufferReturn<Allowed>> {
		if (config?.mode === 'stream') {
			return this.readStream(key, companyId)
		}

		return this.readBuffer(key, companyId)
	}

	async list(companyId: string): Promise<Array<BaseFile>> {
		const rows = await prisma.file.findMany({
			where: { company: { id: companyId } },
		})

		if (rows.length === 0) return []

		const company = (await prisma.company.findFirstOrThrow({
			where: { id: companyId, storageId: { not: null } },
		})) as { storageId: string } & Company
		const out = await Promise.all(
			rows.map(async row => {
				const head = await r2.send(
					new HeadObjectCommand({
						Bucket: env.AWS_BUCKET_NAME,
						Key: row.key,
					})
				)

				const mime = (row.contentType ??
					head.ContentType ??
					'application/octet-stream') as Allowed
				if (!this.validateMediaType(mime)) {
					throw new Error(`Arquivo salvo com MIME não aceito: ${mime}`)
				}

				const size = Number(head.ContentLength ?? 0)
				const metaFilename = head.Metadata?.filename
					? decodeURIComponent(head.Metadata.filename)
					: undefined
				const filename = metaFilename || row.name || row.key

				const file: BaseFile = {
					key: row.key,
					size,
					mime,
					filename,
					meta: {
						...metaSchema.parse(row.meta),
						indexInStorage: row.indexInStorage,
						storageId: company.storageId,
					},
				}
				return file
			})
		)

		return out
	}

	async readAll(companyId: string): Promise<Array<BufferReturn<Allowed>>>
	async readAll(
		companyId: string,
		config: { mode: 'buffer' }
	): Promise<Array<BufferReturn<Allowed>>>
	async readAll(
		companyId: string,
		config: { mode: 'stream' }
	): Promise<Array<StreamReturn<Allowed>>>
	async readAll(
		companyId: string,
		config?: { mode: 'stream' | 'buffer' }
	): Promise<Array<StreamReturn<Allowed> | BufferReturn<Allowed>>> {
		const rows = await prisma.file.findMany({
			where: { company: { id: companyId } },
			select: { key: true },
		})

		if (rows.length === 0) return []

		const results = await Promise.all(
			rows.map(({ key }) =>
				config?.mode === 'stream'
					? this.readStream(key, companyId)
					: this.readBuffer(key, companyId)
			)
		)

		return results
	}

	async delete(key: string, companyId: string): Promise<void> {
		// 1) valida posse via DB; se não existir no DB, permita apenas caso a key tenha o prefixo da empresa
		const row = await prisma.file.findUnique({
			where: { key },
			select: { id: true, companyId: true },
		})

		if (row) {
			if (row.companyId !== companyId) {
				throw new Error('Arquivo não encontrado')
			}
		} else {
			// Sem registro no DB: como proteção extra, só permita se a key obedecer ao padrão esperado da empresa
			if (!key.startsWith(`${companyId}--`)) {
				throw new Error('Arquivo não encontrado')
			}
		}

		// 2) tenta excluir no bucket (idempotente)
		try {
			await r2.send(
				new DeleteObjectCommand({
					Bucket: env.AWS_BUCKET_NAME,
					Key: key,
				})
			)
		} catch (err: any) {
			// R2/S3 geralmente não erra em delete de chave inexistente; se errar, seguimos para limpar DB mesmo assim
		}

		// 3) tenta excluir no DB (idempotente)
		try {
			await prisma.file.delete({ where: { key } })
		} catch (err: any) {
			// P2025 = record not found → ok (idempotente)
			if (err?.code !== 'P2025') throw err
		}
	}
}
