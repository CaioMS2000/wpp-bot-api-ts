// import * as dotenv from 'dotenv'
import { z } from 'zod'

// dotenv.config({ override: true })

export const envSchema = z.object({
	MODE: z.enum(['development', 'production', 'test']).default('development'),
	VERIFICATION_TOKEN: z.string(),
	WPP_TOKEN: z.string(),
	PHONE_NUMBER_ID: z.string(),
	OPENAI_API_KEY: z.string(),
	PORT: z.coerce.number().catch(8000),
	HTTP_TOKEN_SECRET: z.string(),
	HTTP_COOKIE_NAME: z.string(),
	CORS_ORIGINS: z.string(),
})
export const env = envSchema.parse(process.env)
