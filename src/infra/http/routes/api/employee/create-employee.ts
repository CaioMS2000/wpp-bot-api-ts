import { departmentSchema } from '@/modules/web-api/@types/schemas'
import { CreateEmployeeUseCase } from '@/modules/web-api/use-cases/create-employee-use-case'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	createEmployeeUseCase: CreateEmployeeUseCase
}

export const paramsSchema = z.object({
	cnpj: z.string(),
})

const bodySchema = z.object({
	name: z.string(),
	phone: z.string(),
	departmentId: z.string().nullable(),
})

const responseSchema = {
	201: z.object({
		employee: z.object({
			name: z.string(),
			phone: z.string(),
			department: departmentSchema.nullable(),
		}),
	}),
}

export async function createEmployee(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post(
			'/api/company/:cnpj/employees',
			{
				schema: {
					tags: ['employees'],
					summary: 'Create a new employee',

					params: paramsSchema,
					body: bodySchema,
					response: responseSchema,
				},
			},
			async (request, reply) => {
				const { createEmployeeUseCase } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)
				const { employee, department } = await createEmployeeUseCase.execute({
					...request.body,
					companyId: company.id,
				})
				const data = {
					employee: {
						name: employee.name,
						phone: employee.phone,
						department: department,
					},
				}

				return reply.status(201).send(data)
			}
		)
}
