import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'
import { GetChatsUseCase } from '@/domain/web-api/use-cases/get-chats-use-case'

type Resources = {
	getChatsUseCase: GetChatsUseCase
}

export async function getAllChats(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			'/api/company/:cnpj/chats',
			{
				schema: {
					tags: ['chats'],
					summary: 'Get all chats of a company',
					security: [{ bearerAuth: [] }],
					params: z.object({
						cnpj: z.string(),
					}),
				},
			},
			async (request, reply) => {
				const { getChatsUseCase } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)
				const chats = await getChatsUseCase.execute(company.id)

				return reply.status(201).send({
					chats,
				})
			}
		)
}
