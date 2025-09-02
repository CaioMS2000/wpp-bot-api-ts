import { env } from '@/config/env'
import { S3Client } from '@aws-sdk/client-s3'

export const r2 = new S3Client({
	region: 'auto',
	endpoint: env.CLOUDFLARE_ENDPOINT,
	credentials: {
		accessKeyId: env.AWS_ACCESS_KEY_ID,
		secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
	},
})
