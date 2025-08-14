import { businessHoursSchema } from '@/modules/web-api/@types/schemas'
import { UpdateCompanyUseCase } from '@/modules/web-api/use-cases/update-company-use-case'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	updateCompanyUseCase: UpdateCompanyUseCase
}

const bodySchema = z
	.object({
		name: z.string(),
		phone: z.string(),
		cnpj: z.string(),
		email: z.string().optional(),
		website: z.string().optional(),
		description: z.string().optional(),
		businessHours: businessHoursSchema,
	})
	.partial()

export const paramsSchema = z.object({
	cnpj: z.string(),
})

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
					body: bodySchema,
					params: paramsSchema,
					response: { 200: z.null() },
				},
			},
			async (request, reply) => {
				const { updateCompanyUseCase } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)
				const info = await updateCompanyUseCase.execute(
					company.cnpj,
					request.body
				)

				return reply.status(200).send()
			}
		)
}
