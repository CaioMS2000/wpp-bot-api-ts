import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { AppError } from '@/infra/http/errors'
import { auth } from '../../../middlewares/auth'
import type { FaqRepository } from '@/repository/FaqRepository'
import { entryResponse, idParam, paramsByCnpj } from '../schemas'

type Resources = { faqRepository: FaqRepository }

export async function getEntry(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get('/api/tenant/:cnpj/faq/entry/:id', {
			schema: {
				tags: ['FAQ'],
				summary: 'Get FAQ entry by id',
				params: paramsByCnpj.merge(idParam),
				response: {
					...entryResponse,
					404: z.object({
						error: z.object({
							code: z.string(),
							message: z.string(),
							hint: z.string().optional(),
							details: z.any().optional(),
						}),
					}),
				},
			},
			handler: async (req, reply) => {
				const { tenant } = await req.getAdminMembership(req.params.cnpj)
				const entry = await resources.faqRepository.getEntry(
					tenant.id,
					req.params.id
				)
				if (!entry)
					throw AppError.notFound('NOT_FOUND', 'Entrada de FAQ não encontrada.')
				return reply.send(entry)
			},
		})
}
