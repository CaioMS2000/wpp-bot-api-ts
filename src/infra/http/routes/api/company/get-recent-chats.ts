import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'
import { GetRecentChatsUseCase } from '@/domain/web-api/use-cases/get-recent-chats-use-case'

type Resources = {
	getRecentChatsUseCase: GetRecentChatsUseCase
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
				const { getRecentChatsUseCase } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)
				const chats = await getRecentChatsUseCase.execute(company.id)

				return reply.status(201).send({
					chats,
				})
			}
		)
}
