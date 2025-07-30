import { APIService } from '@/domain/web-api/services/api-service'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	apiService: APIService
}

export async function getEmployee(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			'/api/company/:cnpj/employee/:phone',
			{
				schema: {
					tags: ['employees'],
					summary: 'Get an employee of a company',
					security: [{ bearerAuth: [] }],
					params: z.object({
						cnpj: z.string(),
						phone: z.string(),
					}),
				},
			},
			async (request, reply) => {
				const { apiService } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)
				const { phone } = request.params
				const employee = await apiService.getEmployeeByPhone(company.id, phone)

				return reply.status(200).send({
					employee,
				})
			}
		)
}
