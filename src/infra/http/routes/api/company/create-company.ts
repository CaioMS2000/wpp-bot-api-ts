import { APIService } from '@/domain/web-api/services/api-service'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'
import { createCompanySchema } from '@/domain/web-api/services/schemas'

type Resources = {
	apiService: APIService
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
					// response: {
					//   201: z.object({
					//     companyId: z.string().uuid(),
					//   }),
					// },
				},
			},
			async (request, reply) => {
				const { apiService } = resources
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

				await apiService.createCompany({
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
