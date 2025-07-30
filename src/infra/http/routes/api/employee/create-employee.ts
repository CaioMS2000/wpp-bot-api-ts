import { type APIService } from '@/domain/web-api/services/api-service'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'
import { createEmployeeSchema } from '@/domain/web-api/services/schemas'

type Resources = {
	apiService: APIService
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
				const { apiService } = resources
				const { manager, company } = await request.getUserMembership(
					request.params.cnpj
				)
				const employee = await apiService.createEmployee(request.body)

				return reply.status(201).send()
			}
		)
}
