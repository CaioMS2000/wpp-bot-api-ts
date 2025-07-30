import { APIService } from '@/domain/web-api/services/api-service'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	apiService: APIService
}

export async function getCompanyInfo(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			'/api/company/:cnpj/info',
			{
				schema: {
					tags: ['company'],
					summary: 'Obter informações da empresa',
					security: [{ bearerAuth: [] }],
					params: z.object({
						cnpj: z.string(),
					}),
				},
			},
			async (request, reply) => {
				const { apiService } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)
				const info = await apiService.getCompanyInfo(company.id)

				return reply.status(200).send({
					company: info,
				})
			}
		)
}
