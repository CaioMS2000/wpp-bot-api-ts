import z from 'zod'

export const chattingWithEmployeeMetadataSchema = z.object({
	departmentId: z.string(),
})
