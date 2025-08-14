import z from 'zod'

export const chattingWithClientMetadataSchema = z.object({
	departmentId: z.string(),
	clientPhone: z.string(),
})
