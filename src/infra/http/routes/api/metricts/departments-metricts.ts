import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'
import { GetDepartmentsMetricsUseCase } from '@/domain/web-api/use-cases/get-departments-metrics-use-case'
import { logger } from '@/core/logger'

type Resources = {
	getDepartmentsMetricsUseCase: GetDepartmentsMetricsUseCase
}

export async function getDepartmentsMetrics(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			'/api/company/:cnpj/departments/metrics',
			{
				schema: {
					tags: ['metrics'],
					summary: 'Get departments metrics of a company',
					security: [{ bearerAuth: [] }],
					params: z.object({
						cnpj: z.string(),
					}),
				},
			},
			async (request, reply) => {
				const { getDepartmentsMetricsUseCase } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)
				const result = await getDepartmentsMetricsUseCase.execute(company.id)

				return reply.status(201).send({
					data: result,
				})
			}
		)
}
