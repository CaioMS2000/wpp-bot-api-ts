import { CreateEmployeeUseCase } from '@/domain/web-api/use-cases/create-employee-use-case'
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
	departmentId: z.string().optional(),
})

const responseSchema = {
	200: z.object({
		employee: z.object({
			name: z.string(),
			phone: z.string(),
			departmentId: z.string().nullable(),
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
					security: [{ bearerAuth: [] }],
					params: paramsSchema,
					body: bodySchema,
					response: responseSchema,
				},
			},
			async (request, reply) => {
				const { createEmployeeUseCase } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)
				const employee = await createEmployeeUseCase.execute({
					...request.body,
					companyId: company.id,
				})

				return reply.status(201).send({ employee })
			}
		)
}
