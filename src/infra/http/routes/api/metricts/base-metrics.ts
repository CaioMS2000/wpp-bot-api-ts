import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'
import { GetBaseMetricsUseCase } from '@/domain/web-api/use-cases/get-base-metrics-use-case'
import { logger } from '@/core/logger'

type Resources = {
	getBaseMetricsUseCase: GetBaseMetricsUseCase
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
					params: z.object({
						cnpj: z.string(),
					}),
				},
			},
			async (request, reply) => {
				const { getBaseMetricsUseCase } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)
				const result = await getBaseMetricsUseCase.execute(company.id)

				return reply.status(201).send({
					...result,
				})
			}
		)
}
