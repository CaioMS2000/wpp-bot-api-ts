import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../../../middlewares/auth'
import type { FaqRepository } from '@/repository/FaqRepository'
import { categoryCreateBody, categoryResponse, paramsByCnpj } from '../schemas'

type Resources = { faqRepository: FaqRepository }

export async function createCategory(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post('/api/tenant/:cnpj/faq/category', {
			schema: {
				tags: ['FAQ'],
				summary: 'Create FAQ category',
				params: paramsByCnpj,
				body: categoryCreateBody,
				response: categoryResponse,
			},
			handler: async (req, reply) => {
				const { tenant } = await req.getAdminMembership(req.params.cnpj)
				const { name } = req.body
				const cat = await resources.faqRepository.createCategory(
					tenant.id,
					name
				)
				return reply.send(cat)
			},
		})
}
