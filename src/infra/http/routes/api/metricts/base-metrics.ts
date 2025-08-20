import { logger } from '@/logger'
import { GetBaseMetricsUseCase } from '@/modules/web-api/use-cases/get-base-metrics-use-case'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	getBaseMetricsUseCase: GetBaseMetricsUseCase
}

export const paramsSchema = z.object({
	cnpj: z.string(),
})

export const responseSchema = {
	200: z.object({
		todayConversationsCount: z.number(),
		totalActiveClients: z.number(),
		responseRate: z.number(),
		averageResponseTime: z.number(),
		totalAiConversations: z.number(),
	}),
}

export async function getBaseMetrics(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			'/api/company/:cnpj/metrics',
			{
				schema: {
					tags: ['metrics'],
					summary: 'Get base metrics of a company',
					security: [{ bearerAuth: [] }],
					params: paramsSchema,
					response: responseSchema,
				},
			},
			async (request, reply) => {
				const { getBaseMetricsUseCase } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)
				const result = await getBaseMetricsUseCase.execute(company.id)

				return reply.status(200).send({
					...result,
				})
			}
		)
}
