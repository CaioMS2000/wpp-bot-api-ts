import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../../../middlewares/auth'
import type { FaqRepository } from '@/repository/FaqRepository'
import { entryListResponse, paramsByCnpj } from '../schemas'
import { z } from 'zod'

const query = z.object({ categoryId: z.string().min(1) })
type Resources = { faqRepository: FaqRepository }

export async function listEntries(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get('/api/tenant/:cnpj/faq/entry', {
			schema: {
				tags: ['FAQ'],
				summary: 'List FAQ entries by category',
				params: paramsByCnpj,
				querystring: query,
				response: entryListResponse,
			},
			handler: async (req, reply) => {
				const { tenant } = await req.getAdminMembership(req.params.cnpj)
				const items = await resources.faqRepository.listEntries(
					tenant.id,
					req.query.categoryId
				)
				return reply.send({ items })
			},
		})
}
