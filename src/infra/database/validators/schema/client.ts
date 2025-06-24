import { z } from 'zod'

export const clientSchema = z.object({
    phone: z.string(),
})
