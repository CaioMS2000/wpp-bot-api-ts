import z from 'zod'

export const listingFAQItemsMetadataSchema = z.object({
	categoryId: z.string(),
})
