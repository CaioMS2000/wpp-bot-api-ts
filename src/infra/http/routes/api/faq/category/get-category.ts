import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { AppError } from '@/infra/http/errors'
import { auth } from '../../../middlewares/auth'
import type { FaqRepository } from '@/repository/FaqRepository'
import { categoryResponse, idParam, paramsByCnpj } from '../schemas'

type Resources = { faqRepository: FaqRepository }

export async function getCategory(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get('/api/tenant/:cnpj/faq/category/:id', {
			schema: {
				tags: ['FAQ'],
				summary: 'Get FAQ category by id',
				params: paramsByCnpj.merge(idParam),
				response: {
					...categoryResponse,
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
				const cat = await resources.faqRepository.getCategory(
					tenant.id,
					req.params.id
				)
				if (!cat)
					throw AppError.notFound('NOT_FOUND', 'Categoria não encontrada.')
				return reply.send(cat)
			},
		})
}
