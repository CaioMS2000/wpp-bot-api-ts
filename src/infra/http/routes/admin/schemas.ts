import { z } from 'zod'

export const keyParam = z.object({ key: z.string().min(1) })
export const configItem = z.object({
	key: z.string(),
	value: z.any(),
	version: z.number(),
	updatedAt: z.string(),
	updatedBy: z.string().nullable().optional(),
})
export const listResponse = z.object({ items: z.array(configItem) })
export const getResponse = configItem
export const upsertBody = z.object({ value: z.any() })
export const upsertResponse = configItem
