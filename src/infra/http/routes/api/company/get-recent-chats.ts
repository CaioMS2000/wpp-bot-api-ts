import { APIService } from '@/domain/web-api/services/api-service'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	apiService: APIService
}

export async function getRecentChats(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			'/api/company/:cnpj/chats/recent',
			{
				schema: {
					tags: ['chats'],
					summary: 'Get recent chats of a company',
					security: [{ bearerAuth: [] }],
					params: z.object({
						cnpj: z.string(),
					}),
				},
			},
			async (request, reply) => {
				const { apiService } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)
				const chats = await apiService.getRecentChats(company.id)

				return reply.status(201).send({
					chats,
				})
			}
		)
}
