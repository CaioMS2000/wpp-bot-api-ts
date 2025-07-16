import * as dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config({ override: true }) //tive que fazer esse carregamento manual devido a conflitos de variaveis definidas no .env e no sistema em sí com o mesmo nome

export const envSchema = z.object({
    MODE: z.enum(['development', 'production', 'test']).default('development'),
    VERIFICATION_TOKEN: z.string(),
    WPP_TOKEN: z.string(),
    PHONE_NUMBER_ID: z.string(),
    OPENAI_API_KEY: z.string(),
})
export const env = envSchema.parse(process.env)
