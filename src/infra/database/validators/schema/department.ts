import { z } from 'zod'

export const departmentSchema = z.object({
    name: z.string(),
})
