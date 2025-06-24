import { z } from 'zod'

export const departmentsValidatorSchema = z.object({
    departments: z.array(z.string()),
})
