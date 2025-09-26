import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../../../middlewares/auth'
import type { FaqRepository } from '@/repository/FaqRepository'
import { entryCreateBody, entryResponse, paramsByCnpj } from '../schemas'

type Resources = { faqRepository: FaqRepository }

export async function createEntry(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post('/api/tenant/:cnpj/faq/entry', {
			schema: {
				tags: ['FAQ'],
				summary: 'Create FAQ entry',
				params: paramsByCnpj,
				body: entryCreateBody,
				response: entryResponse,
			},
			handler: async (req, reply) => {
				const { tenant } = await req.getManagerMembership(req.params.cnpj)
				const { categoryId, question, answer } = req.body
				const entry = await resources.faqRepository.createEntry(
					tenant.id,
					categoryId,
					question,
					answer
				)
				return reply.send(entry)
			},
		})
}
