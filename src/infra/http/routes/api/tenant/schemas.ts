import { z } from 'zod'

export const tenantIdParam = z.object({ id: z.string().min(1) })

export const tenantCreateBody = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
})
export const tenantUpdateBody = z.object({ name: z.string().min(1) })

export const tenantResponse = z.object({
	id: z.string(),
	name: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
})
export const tenantListResponse = z.object({ items: z.array(tenantResponse) })
