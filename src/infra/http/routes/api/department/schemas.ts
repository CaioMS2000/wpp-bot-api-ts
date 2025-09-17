import { z } from 'zod'

export const paramsByCnpj = z.object({ cnpj: z.string().min(1) })
export const idParam = z.object({ id: z.string().min(1) })

export const createBody = z.object({
	name: z.string().min(1),
	description: z.string().optional(),
	leadEmployeeId: z.string().optional(),
	employees: z.array(z.string()).optional(),
})
export const updateBody = z.object({
	name: z.string().min(1).optional(),
	description: z.string().nullable().optional(),
	leadEmployeeId: z.string().nullable().optional(),
	employees: z.array(z.string()).optional(),
})

export const departmentResponse = {
	200: z.object({
		id: z.string(),
		name: z.string(),
		description: z.string().nullable().optional(),
		employees: z
			.array(z.object({ id: z.string(), name: z.string() }))
			.default([]),
		totalEmployees: z.number().int().nonnegative(),
	}),
}
export const departmentListResponse = {
	200: z.object({
		items: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				description: z.string().nullable().optional(),
			})
		),
	}),
}
