import {
	S3Client,
	PutObjectCommand,
	HeadObjectCommand,
	GetObjectCommand,
} from '@aws-sdk/client-s3'
import { env } from '@/config/env'

export class AuditStorage {
	private readonly s3: S3Client
	private readonly bucket: string

	constructor() {
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

	async putJson(key: string, obj: unknown): Promise<string> {
		const body = Buffer.from(JSON.stringify(obj))
		await this.s3.send(
			new PutObjectCommand({
				Bucket: this.bucket,
				Key: key,
				Body: body,
				ContentType: 'application/json',
				ContentLength: body.length,
				Metadata: {
					kind: 'conversation_audit',
				},
			})
		)
		return `r2://${this.bucket}/${key}`
	}

	private parseUri(s3Uri: string): { bucket: string; key: string } | null {
		// Expected format: r2://bucket/key or s3://bucket/key
		try {
			const m = s3Uri.match(/^[a-z0-9]+:\/\/([^/]+)\/(.+)$/i)
			if (!m) return null
			return { bucket: m[1], key: m[2] }
		} catch {
			return null
		}
	}

	async existsUri(s3Uri: string): Promise<boolean> {
		const parsed = this.parseUri(s3Uri)
		if (!parsed) return false
		try {
			await this.s3.send(
				new HeadObjectCommand({ Bucket: parsed.bucket, Key: parsed.key })
			)
			return true
		} catch {
			return false
		}
	}

	async getJsonUri<T = unknown>(s3Uri: string): Promise<T | null> {
		const parsed = this.parseUri(s3Uri)
		if (!parsed) return null
		try {
			const out = await this.s3.send(
				new GetObjectCommand({ Bucket: parsed.bucket, Key: parsed.key })
			)
			const stream = out.Body as any
			const chunks: Buffer[] = []
			await new Promise<void>((resolve, reject) => {
				stream.on('data', (c: any) =>
					chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c))
				)
				stream.on('end', resolve)
				stream.on('error', reject)
			})
			const buf = Buffer.concat(chunks)
			return JSON.parse(buf.toString('utf8')) as T
		} catch {
			return null
		}
	}
}
