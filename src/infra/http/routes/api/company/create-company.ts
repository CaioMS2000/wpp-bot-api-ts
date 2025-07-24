import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

export async function createCompany(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post(
			'/company',
			{
				schema: {
					tags: ['Companys'],
					summary: 'Create a new company',
					security: [{ bearerAuth: [] }],
					body: z.object({
						name: z.string(),
					}),
					// response: {
					//   201: z.object({
					//     companyId: z.string().uuid(),
					//   }),
					// },
				},
			},
			async (request, reply) => {
				const userId = await request.getCurrentUserID()

				const { name } = request.body

				console.log(
					'We need to create a company with the following name:',
					name
				)

				return reply.status(201).send({
					message: 'Company created successfully',
				})
			}
		)
}
