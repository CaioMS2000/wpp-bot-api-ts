import { APIService } from '@/domain/web-api/services/api-service'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'
import { createCompanySchema } from '@/domain/web-api/services/schemas'

type Resources = {
	apiService: APIService
}

export async function updateCompany(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.put(
			'/api/company/:cnpj',
			{
				schema: {
					tags: ['company'],
					summary: 'Atualizar informações da empresa',
					security: [{ bearerAuth: [] }],
					body: createCompanySchema.partial(),
					params: z.object({
						cnpj: z.string(),
					}),
				},
			},
			async (request, reply) => {
				const { apiService } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)
				const info = await apiService.updateCompany(company.cnpj, request.body)

				return reply.status(200).send({
					company: info,
				})
			}
		)
}
