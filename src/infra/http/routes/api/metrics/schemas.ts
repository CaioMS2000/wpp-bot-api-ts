import { z } from 'zod'

export const paramsByCnpj = z.object({ cnpj: z.string().min(1) })

export const overviewQuery = z.object({
	scope: z.enum(['day', 'month']).default('month'),
})
export const overviewResponse = {
	200: z.object({
		conversations: z.number(),
		activeCustomers: z.number(),
		responseRate: z.number(), // 0..1
		avgFirstResponseSeconds: z.number().nullable(),
		aiResolved: z.number(),
	}),
}

export const weeklyResponse = {
	200: z.object({
		items: z.array(
			z.object({
				date: z.string(), // YYYY-MM-DD
				total: z.number(),
				resolved: z.number(),
				pending: z.number(),
			})
		),
	}),
}

export const departmentQuery = z.object({
	from: z.string().datetime().optional(),
	to: z.string().datetime().optional(),
})
export const departmentResponse = {
	200: z.object({
		items: z.array(
			z.object({ department: z.string().nullable(), count: z.number() })
		),
	}),
}

export const queueResponse = {
	200: z.object({
		totalQueued: z.number(),
		byDepartment: z.array(z.object({ name: z.string(), count: z.number() })),
	}),
}
