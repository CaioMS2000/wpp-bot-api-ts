import { createCompanySchema } from '@/domain/web-api/@types/schemas'
import { CreateCompanyUseCase } from '@/domain/web-api/use-cases/create-company-use-case'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	createCompanyUseCase: CreateCompanyUseCase
}

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
					body: createCompanySchema,
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

				return reply.status(201).send({
					message: 'Company created successfully',
				})
			}
		)
}
