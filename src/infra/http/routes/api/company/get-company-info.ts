import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'
import { GetCompanyInfoUseCase } from '@/domain/web-api/use-cases/get-company-info-use-case'

type Resources = {
	getCompanyInfoUseCase: GetCompanyInfoUseCase
}

export async function getCompanyInfo(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			'/api/company/:cnpj/info',
			{
				schema: {
					tags: ['company'],
					summary: 'Obter informações da empresa',
					security: [{ bearerAuth: [] }],
					params: z.object({
						cnpj: z.string(),
					}),
				},
			},
			async (request, reply) => {
				const { getCompanyInfoUseCase } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)
				const info = await getCompanyInfoUseCase.execute(company.id)

				return reply.status(200).send({
					company: info,
				})
			}
		)
}
