import { z } from 'zod'

export const paramsByCnpj = z.object({ cnpj: z.string().min(1) })
export const idParam = z.object({ id: z.string().min(1) })

export const createBody = z.object({
	name: z.string().min(1),
	phone: z.string().min(5),
	departmentName: z.string().min(1).nullable().optional(),
})
export const updateBody = z.object({
	name: z.string().min(1).optional(),
	phone: z.string().min(5).optional(),
	departmentName: z.string().min(1).nullable().optional(),
})

export const employeeResponse = {
	200: z.object({
		id: z.string(),
		name: z.string(),
		phone: z.string(),
		departmentName: z.string().nullable().optional(),
	}),
}
export const employeeListResponse = {
	200: z.object({ items: z.array(employeeResponse[200]) }),
}
