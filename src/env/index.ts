import { z } from 'zod'

export const envSchema = z.object({
    MODE: z.enum(['development', 'production', 'test']).default('development'),
    VERIFICATION_TOKEN: z.string(),
})

export const env = envSchema.parse(process.env)
