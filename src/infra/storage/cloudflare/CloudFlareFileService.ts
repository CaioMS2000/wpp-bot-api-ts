import { createHash, randomUUID } from 'node:crypto'
import { env } from '@/config/env'
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { FileInput, FileService, SavedFile } from '../file-service'

export const AllowedMedia = ['application/pdf', 'text/plain'] as const
export type Allowed = (typeof AllowedMedia)[number]

export class CloudFlareFileService extends FileService<Allowed> {
	private readonly s3: S3Client
	private readonly bucket: string

	constructor() {
		super(AllowedMedia)
		const endpoint = env.CLOUDFLARE_ENDPOINT
		const region = 'auto'
		this.s3 = new S3Client({
			region,
			endpoint,
			forcePathStyle: Boolean(endpoint),
			credentials: {
				accessKeyId: env.AWS_ACCESS_KEY_ID,
				secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
			},
		})
		this.bucket = env.AWS_BUCKET_NAME
	}

	validateMediaType(mt: string): mt is Allowed {
		return (this.accepts as readonly string[]).includes(mt)
	}

	async save(
		file: FileInput<Allowed>,
		tenantId?: string
	): Promise<SavedFile<Allowed>> {
		const id = randomUUID()
		const filename = file.filename
		const checksum = createHash('sha256')
		let buf: Buffer
		if (file.kind === 'buffer') {
			buf = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data)
		} else {
			const chunks: Buffer[] = []
			await new Promise<void>((resolve, reject) => {
				file.stream.on('data', c =>
					chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c))
				)
				file.stream.on('end', resolve)
				file.stream.on('error', reject)
			})
			buf = Buffer.concat(chunks)
		}
		checksum.update(buf)
		const sha256 = checksum.digest('hex')

		const ext = filename.includes('.') ? filename.split('.').pop() : undefined
		const key = `${tenantId ?? 'no-tenant'}--${id}${ext ? `.${ext}` : ''}`

		const meta = {
			sha256,
			filename: encodeURIComponent(filename),
			tenantid: tenantId ?? '',
		}

		await this.s3.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: buf,
				ContentType: file.mimetype,
				Metadata: meta,
				ContentLength: buf.length,
			})
		)

		return { id, filename, mimetype: file.mimetype, size: buf.byteLength, key }
	}

	async removeByKey(key: string, _tenantId?: string): Promise<void> {
		try {
			await this.s3.send(
				new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
			)
		} catch {
			// ignore errors (e.g., already deleted)
		}
	}
}
