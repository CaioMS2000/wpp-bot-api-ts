import z from 'zod'

export const listingDepartmentQueueMetadataSchema = z.object({
	departmentId: z.string(),
})
