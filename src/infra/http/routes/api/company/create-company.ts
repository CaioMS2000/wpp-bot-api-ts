import { businessHoursSchema } from '@/modules/web-api/@types/schemas'
import { CreateCompanyUseCase } from '@/modules/web-api/use-cases/create-company-use-case'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	createCompanyUseCase: CreateCompanyUseCase
}

const bodySchema = z.object({
	name: z.string(),
	phone: z.string(),
	cnpj: z.string(),
	email: z.string().optional(),
	website: z.string().optional(),
	description: z.string().optional(),
	businessHours: businessHoursSchema,
})

export async function createCompany(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post(
			'/api/company',
			{
				schema: {
					tags: ['Companies'],
					summary: 'Create a new company',
					security: [{ bearerAuth: [] }],
					body: bodySchema,
					response: { 204: z.null() },
				},
			},
			async (request, reply) => {
				const { createCompanyUseCase } = resources
				const userId = await request.getCurrentUserID()

				const {
					name,
					phone,
					cnpj,
					email,
					website,
					description,
					businessHours,
				} = request.body

				await createCompanyUseCase.execute({
					name,
					phone,
					cnpj,
					email,
					website,
					description,
					managerId: userId,
					businessHours,
				})

				return reply.status(204).send()
			}
		)
}
