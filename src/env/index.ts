import { z } from 'zod'

export const envSchema = z.object({
    MODE: z.enum(['development', 'production', 'test']).default('development'),
    VERIFICATION_TOKEN: z.string(),
    WPP_TOKEN: z.string(),
    PHONE_NUMBER_ID: z.string(),
})

export const env = envSchema.parse(process.env)
