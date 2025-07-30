import { APIService } from '@/domain/web-api/services/api-service'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	apiService: APIService
}

export async function getAllDepartments(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			'/api/company/:cnpj/departments',
			{
				schema: {
					tags: ['departments'],
					summary: 'Get all departments of a company',
					security: [{ bearerAuth: [] }],
					params: z.object({
						cnpj: z.string(),
					}),
				},
			},
			async (request, reply) => {
				const { apiService } = resources
				const { manager, company } = await request.getUserMembership(
					request.params.cnpj
				)
				const departments = await apiService.getAllCompanyDepartments(
					company.id
				)

				return reply.status(201).send({
					departments,
				})
			}
		)
}
