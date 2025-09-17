import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../../../middlewares/auth'
import type { FaqRepository } from '@/repository/FaqRepository'
import { idParam, paramsByCnpj } from '../schemas'

type Resources = { faqRepository: FaqRepository }

export async function deleteEntry(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.delete('/api/tenant/:cnpj/faq/entry/:id', {
			schema: {
				tags: ['FAQ'],
				summary: 'Delete FAQ entry',
				params: paramsByCnpj.merge(idParam),
			},
			handler: async (req, reply) => {
				const { tenant } = await req.getAdminMembership(req.params.cnpj)
				await resources.faqRepository.removeEntry(tenant.id, req.params.id)
				return reply.status(204).send()
			},
		})
}
