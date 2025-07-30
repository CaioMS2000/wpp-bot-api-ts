import { createEmployeeSchema } from '@/domain/web-api/@types/schemas'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'
import { CreateEmployeeUseCase } from '@/domain/web-api/use-cases/create-employee-use-case'

type Resources = {
	createEmployeeUseCase: CreateEmployeeUseCase
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
					params: z.object({
						cnpj: z.string(),
					}),
					body: createEmployeeSchema,
				},
			},
			async (request, reply) => {
				const { createEmployeeUseCase } = resources
				const { manager, company } = await request.getUserMembership(
					request.params.cnpj
				)
				const employee = await createEmployeeUseCase.execute(request.body)

				return reply.status(201).send()
			}
		)
}
