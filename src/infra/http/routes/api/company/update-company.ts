import { createCompanySchema } from '@/domain/web-api/@types/schemas'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'
import { UpdateCompanyUseCase } from '@/domain/web-api/use-cases/update-company-use-case'

type Resources = {
	updateCompanyUseCase: UpdateCompanyUseCase
}

export async function updateCompany(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.put(
			'/api/company/:cnpj',
			{
				schema: {
					tags: ['company'],
					summary: 'Atualizar informações da empresa',
					security: [{ bearerAuth: [] }],
					body: createCompanySchema.partial(),
					params: z.object({
						cnpj: z.string(),
					}),
				},
			},
			async (request, reply) => {
				const { updateCompanyUseCase } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)
				const info = await updateCompanyUseCase.execute(
					company.cnpj,
					request.body
				)

				return reply.status(200).send({
					company: info,
				})
			}
		)
}
