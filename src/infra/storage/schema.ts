import { z } from 'zod'

const metaValueSchema: z.ZodType<any> = z.lazy(() =>
	z.union([
		z.string(),
		z.number(),
		z.boolean(),
		z.array(metaValueSchema),
		z.record(metaValueSchema),
	])
)

export const metaSchema = z
	.object({
		tags: z.array(z.string()),
		instruction: z.string(),
	})
	.catchall(metaValueSchema)
