import { config } from 'dotenv'
import { z } from 'zod'

config({
	path: '.env',
	// override: process.env.NODE_ENV !== 'production',
	override: true,
})

export const envSchema = z.object({
	NODE_ENV: z
		.enum(['development', 'production', 'test'])
		.default('development'),
	VERIFICATION_TOKEN: z.string(),
	WPP_TOKEN: z.string(),
	PHONE_NUMBER_ID: z.string(),
	OPENAI_API_KEY: z.string(),
	PORT: z.coerce.number().catch(8000),
	HTTP_TOKEN_SECRET: z.string(),
	HTTP_COOKIE_NAME: z.string(),
	CORS_ORIGINS: z.string(),
	UPLOAD_FILES_LIMIT: z.number().default(10),
	UPLOAD_FILE_SIZE_LIMIT: z.number().default(10), // in MB
	AWS_ACCESS_KEY_ID: z.string(),
	AWS_SECRET_ACCESS_KEY: z.string(),
	AWS_BUCKET_NAME: z.string(),
	CLOUDFLARE_ACCOUNT_ID: z.string(),
	CLOUDFLARE_ENDPOINT: z.string(),
	AUTO_CLOSE_SLA_MINUTES: z.coerce.number().default(10),
	AUTO_CLOSE_IDLE_HOURS: z.coerce.number().default(24),
})

const env = envSchema.parse(process.env)

export { env }
