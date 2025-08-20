import { chatMessageSchema } from '@/modules/web-api/@types/schemas'
import { GetRecentChatsUseCase } from '@/modules/web-api/use-cases/get-recent-chats-use-case'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	getRecentChatsUseCase: GetRecentChatsUseCase
}

export const paramsSchema = z.object({
	cnpj: z.string(),
})

export const responseSchema = {
	200: z.object({
		chats: z
			.array(
				z.object({
					id: z.string(),
					startedAt: z.date(),
					endedAt: z.date().nullable(),
					messages: z.array(chatMessageSchema),
				})
			)
			.max(10),
	}),
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
					params: paramsSchema,
					response: responseSchema,
				},
			},
			async (request, reply) => {
				const { getRecentChatsUseCase } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)
				const chats = await getRecentChatsUseCase.execute(company.id)

				return reply.status(200).send({
					chats,
				})
			}
		)
}
