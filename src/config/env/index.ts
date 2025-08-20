import * as dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config({ override: process.env.NODE_ENV !== 'production' })

export const envSchema = z.object({
	NODE_ENV: z
		.enum(['development', 'production', 'test'])
		.default('development'),
	TESTING_APP: z.enum(['yes', 'no']).default('yes'),
	VERIFICATION_TOKEN: z.string(),
	WPP_TOKEN: z.string(),
	PHONE_NUMBER_ID: z.string(),
	OPENAI_API_KEY: z.string(),
	PORT: z.coerce.number().catch(8000),
	HTTP_TOKEN_SECRET: z.string(),
	HTTP_COOKIE_NAME: z.string(),
	CORS_ORIGINS: z.string(),
	LOCAL_FORWARD_URL: z.string().url().optional(),
	FORWARD_SECRET: z.string().min(10).optional(),
})

export const env = envSchema.parse(process.env)
