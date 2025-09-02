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
		days: z.array(
			z.object({
				date: z.date(),
				dayOfWeek: z.number().int().min(0).max(6),
				label: z.string(),
				total: z.number().int().nonnegative(),
				resolved: z.number().int().nonnegative(),
				pending: z.number().int().nonnegative(),
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
					summary: 'Get weekly conversations metrics (per weekday)',

					params: paramsSchema,
					response: responseSchema,
				},
			},
			async (request, reply) => {
				const { getWeekConversationsMetrics } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)

				const result = await getWeekConversationsMetrics.execute(company.id)

				return reply.status(200).send(result)
			}
		)
}
