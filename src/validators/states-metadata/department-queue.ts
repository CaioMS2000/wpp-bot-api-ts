import z from 'zod'

export const departmentQueueMetadataSchema = z.object({
	departmentId: z.string(),
})
