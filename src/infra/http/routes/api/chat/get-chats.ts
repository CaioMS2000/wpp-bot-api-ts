import { chatMessageSchema } from '@/modules/web-api/@types/schemas'
import { GetChatsUseCase } from '@/modules/web-api/use-cases/get-chats-use-case'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	getChatsUseCase: GetChatsUseCase
}

export const paramsSchema = z.object({
	cnpj: z.string(),
})

export const responseSchema = {
	200: z.object({
		chats: z.array(
			z.object({
				id: z.string(),
				startedAt: z.date(),
				endedAt: z.date().nullable(),
				messages: z.array(chatMessageSchema),
			})
		),
		clientsInQueue: z.number(),
	}),
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
					params: paramsSchema,
					response: responseSchema,
				},
			},
			async (request, reply) => {
				const { getChatsUseCase } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)
				const { chats, clientsInQueue } = await getChatsUseCase.execute(
					company.id
				)

				return reply.status(201).send({ chats, clientsInQueue })
			}
		)
}
