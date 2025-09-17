import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { FileInput, FileService, SavedFile } from '../file-service'

export const AllowedMedia = ['application/pdf'] as const
export type Allowed = (typeof AllowedMedia)[number]

const sanitize = (text: string) =>
	text
		.normalize('NFD')
		.replace(/\p{M}/gu, '')
		.replace(/[^a-zA-Z0-9._-]+/g, '_')
		.replace(/_+/g, '_')
		.replace(/^_+|_+$/g, '')

export class LocalFileService extends FileService<Allowed> {
	constructor() {
		super(AllowedMedia)
	}

	validateMediaType(mt: string): mt is Allowed {
		return (this.accepts as readonly string[]).includes(mt)
	}

	async save(
		file: FileInput<Allowed>,
		tenantId?: string
	): Promise<SavedFile<Allowed>> {
		const id = randomUUID()
		const baseDir = path.join(process.cwd(), 'uploads', tenantId ?? 'no-tenant')
		await fs.mkdir(baseDir, { recursive: true })

		const clean = sanitize(file.filename)
		const key = `${id}_${clean}`
		const full = path.join(baseDir, key)

		if (file.kind === 'buffer') {
			const buf = Buffer.isBuffer(file.data)
				? file.data
				: Buffer.from(file.data)
			await fs.writeFile(full, buf)
			return {
				id,
				filename: clean,
				mimetype: file.mimetype,
				size: buf.byteLength,
				key,
			}
		}

		// stream
		const chunks: Buffer[] = []
		await new Promise<void>((resolve, reject) => {
			file.stream.on('data', c =>
				chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c))
			)
			file.stream.on('end', resolve)
			file.stream.on('error', reject)
		})
		const buf = Buffer.concat(chunks)
		await fs.writeFile(full, buf)
		return {
			id,
			filename: clean,
			mimetype: file.mimetype,
			size: buf.byteLength,
			key,
		}
	}

	async removeByKey(key: string, tenantId?: string): Promise<void> {
		const baseDir = path.join(process.cwd(), 'uploads', tenantId ?? 'no-tenant')
		const full = path.join(baseDir, key)
		try {
			await fs.unlink(full)
		} catch {
			// ignore missing file
		}
	}
}
