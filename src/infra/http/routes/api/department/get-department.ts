import { APIService } from '@/domain/web-api/services/api-service'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	apiService: APIService
}

export async function getDepartment(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			'/api/company/:cnpj/department/:id',
			{
				schema: {
					tags: ['departments'],
					summary: 'Get a department of a company',
					security: [{ bearerAuth: [] }],
					params: z.object({
						cnpj: z.string(),
						id: z.string(),
					}),
				},
			},
			async (request, reply) => {
				const { apiService } = resources
				const { id, cnpj } = request.params
				const { company } = await request.getUserMembership(cnpj)
				const department = await apiService.getDepartment(company.id, id)

				return reply.status(200).send({
					department,
				})
			}
		)
}
