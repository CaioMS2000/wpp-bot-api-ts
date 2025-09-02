import { createHash, randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'
import {
	FileMeta,
	BaseFile as _BaseFile,
	FileType as _FileType,
} from '@/@types'
import { openAIClient } from '@/lib/openai'
import { prisma } from '@/lib/prisma'
import { logger } from '@/logger'
import { sanitize } from '@/utils/text'
import { Company } from '@prisma/client'
import { fileTypeFromBuffer, fileTypeFromFile } from 'file-type'
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

const isAllowedFactory =
	(accepts: readonly string[]) =>
	(m: string): m is Allowed =>
		accepts.includes(m)

export class LocalFileService extends FileService<Allowed> {
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

	private getCompanyDir(companyId: string) {
		return path.resolve(process.cwd(), `__uploads/companies/${companyId}`)
	}

	validateMediaType(mt: string): mt is Allowed {
		return AllowedMedia.includes(mt as any)
	}

	async save(
		inputFile: FileInput<Allowed>,
		fileMeta: FileMetaInput,
		companyId: string
	): Promise<FileType> {
		const dir = this.getCompanyDir(companyId)
		await fs.mkdir(dir, { recursive: true })

		if (inputFile.kind !== 'buffer') {
			throw new Error('Stream is not supported yet')
		}

		const isAllowed = isAllowedFactory(this.accepts as readonly string[])

		if (!isAllowed(inputFile.mimetype)) {
			throw new Error(`MIME não permitido: ${inputFile.mimetype}`)
		}

		const buf = Buffer.isBuffer(inputFile.data)
			? inputFile.data
			: Buffer.from(inputFile.data)
		const detected = await fileTypeFromBuffer(buf) // { mime, ext } | undefined

		if (!detected)
			throw new Error('Não foi possível detectar o tipo real do arquivo')

		if (!isAllowed(detected.mime)) {
			throw new Error(`Tipo real não permitido: ${detected.mime}`)
		}

		if (fileMeta.declaredMime && fileMeta.declaredMime !== detected.mime) {
			throw new Error(
				`Divergência de MIME: declarado=${fileMeta.declaredMime}, real=${detected.mime}`
			)
		}

		const ext = detected.ext ?? 'bin'
		const uuid = randomUUID()
		const key = `${uuid}.${ext}` // chave única no storage
		const _humanName = sanitize(inputFile.filename) // (guarde no DB se quiser expor)
		const checksum = createHash('sha256').update(buf).digest('hex')

		await fs.writeFile(path.join(dir, key), buf)

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
		const inStoreFile = await openAIClient.vectorStores.files.create(storeId, {
			file_id: uploaded.id,
			attributes: {
				...Object.fromEntries(tagEntries),
				usage: fileMeta.meta.instruction.slice(0, 512),
			},
		})
		const newFile = await prisma.file.create({
			data: {
				key,
				name: _humanName,
				contentType: detected.mime,
				company: { connect: { id: companyId } },
				meta: JSON.parse(JSON.stringify(fileMeta.meta)),
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

		const dir = this.getCompanyDir(companyId)
		const safeKey = sanitize(key)
		const full = path.join(dir, safeKey)
		const st = await fs.stat(full) // lança se não existir
		const stream = createReadStream(full)

		const detected = await fileTypeFromFile(full)
		if (!detected) {
			throw new Error('Não foi possível detectar o tipo real do arquivo salvo')
		}

		const isAllowed = isAllowedFactory(this.accepts as readonly string[])

		if (!isAllowed(detected.mime)) {
			throw new Error(`Arquivo salvo com MIME não aceito: ${detected.mime}`)
		}

		return {
			id: db.id,
			key: safeKey,
			createdAt: db.createdAt,
			size: st.size,
			mime: detected.mime,
			filename: db.name,
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

		const dir = this.getCompanyDir(companyId)
		const safeKey = sanitize(key)
		const full = path.join(dir, safeKey)
		const buf = await fs.readFile(full) // lança se não existir
		const detected = await fileTypeFromBuffer(buf)

		if (!detected) {
			throw new Error('Não foi possível detectar o tipo real do arquivo salvo')
		}

		const isAllowed = isAllowedFactory(this.accepts as readonly string[])

		if (!isAllowed(detected.mime)) {
			throw new Error(`Arquivo salvo com MIME não aceito: ${detected.mime}`)
		}

		const checksum = createHash('sha256').update(buf).digest('hex')

		return {
			id: db.id,
			key: safeKey,
			createdAt: db.createdAt,
			size: buf.byteLength,
			mime: detected.mime,
			filename: db.name,
			checksum,
			buffer: buf,
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
		const dir = this.getCompanyDir(companyId)
		try {
			const out = await Promise.all(
				rows.map(async f => {
					const full = path.join(dir, f.key)
					const st = await fs.stat(full)

					console.log('file -> ', f.key)
					console.log(st)

					const detected = await fileTypeFromFile(full)

					if (!detected) {
						throw new Error(
							'Não foi possível detectar o tipo real do arquivo salvo'
						)
					}

					if (!this.validateMediaType(detected.mime)) {
						throw new Error(
							`Arquivo salvo com MIME não aceito: ${detected.mime}`
						)
					}

					return {
						key: f.key,
						size: st.size,
						mime: detected.mime,
						filename: f.name,
						meta: {
							...metaSchema.parse(f.meta),
							indexInStorage: f.indexInStorage,
							storageId: company.storageId,
						},
					}
				})
			)

			return out
		} catch (err: any) {
			if (err?.code === 'ENOENT') {
				// diretório não existe ainda → sem arquivos
				return []
			}
			throw err
		}
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
		try {
			const rows = await prisma.file.findMany({
				where: { company: { id: companyId } },
				select: { key: true, name: true, contentType: true, meta: true },
			})
			const results = await Promise.all(
				rows.map(async f => {
					if (config?.mode === 'stream') {
						return this.readStream(f.key, companyId)
					}
					return this.readBuffer(f.key, companyId)
				})
			)

			return results
		} catch (err: any) {
			if (err?.code === 'ENOENT') {
				return []
			}
			throw err
		}
	}

	async delete(key: string, companyId: string): Promise<void> {
		try {
			const dir = this.getCompanyDir(companyId)
			const file = await prisma.file.findFirstOrThrow({
				where: { companyId, key },
			})
			const full = path.join(dir, file.key)

			await fs.unlink(full)
			await prisma.file.delete({ where: { key, companyId } })
		} catch (err: any) {
			if (err?.code === 'ENOENT') return // idempotente: já não existe
			throw err
		}
	}
}
