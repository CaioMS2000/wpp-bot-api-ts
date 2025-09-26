import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../../../middlewares/auth'
import type { FaqRepository } from '@/repository/FaqRepository'
import { categoryListResponse, paramsByCnpj } from '../schemas'

type Resources = { faqRepository: FaqRepository }

export async function listCategories(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get('/api/tenant/:cnpj/faq/category', {
			schema: {
				tags: ['FAQ'],
				summary: 'List FAQ categories',
				params: paramsByCnpj,
				response: categoryListResponse,
			},
			handler: async (req, reply) => {
				const { tenant } = await req.getManagerMembership(req.params.cnpj)
				const items = await resources.faqRepository.listCategories(tenant.id)
				return reply.send({ items })
			},
		})
}
