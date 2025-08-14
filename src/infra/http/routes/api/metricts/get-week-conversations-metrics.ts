import { GetWeekConversationsMetrics } from '@/modules/web-api/use-cases/get-week-conversations-metrics'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	getWeekConversationsMetrics: GetWeekConversationsMetrics
}

export const paramsSchema = z.object({
	cnpj: z.string(),
})

export const responseSchema = {
	200: z.object({
		from: z.date(),
		to: z.date(),
		metrics: z.array(
			z.object({
				date: z.date(),
				dayOfWeek: z.number(),
				total: z.number(),
				conversations: z.array(
					z.object({
						id: z.string(),
						startedAt: z.date(),
						endedAt: z.date().nullable(),
					})
				),
			})
		),
	}),
}

export async function getWeekConversationsMetrics(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			'/api/company/:cnpj/departments/week-metrics',
			{
				schema: {
					tags: ['metrics'],
					summary: 'Get departments metrics of a company',
					security: [{ bearerAuth: [] }],
					params: paramsSchema,
					response: responseSchema,
				},
			},
			async (request, reply) => {
				const { getWeekConversationsMetrics } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)
				const result = await getWeekConversationsMetrics.execute(company.id)
				const data = {
					...result,
					metrics: result.metrics.map(m => ({
						...m,
						conversations: m.conversations.map(c => ({
							id: c.id,
							startedAt: c.startedAt,
							endedAt: c.endedAt,
						})),
					})),
				}

				return reply.status(201).send(data)
			}
		)
}
