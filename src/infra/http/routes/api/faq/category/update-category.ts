import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { AppError } from '@/infra/http/errors'
import { auth } from '../../../middlewares/auth'
import type { FaqCategoryFull, FaqRepository } from '@/repository/FaqRepository'
import {
	categoryUpdateBody,
	categoryResponse,
	idParam,
	paramsByCnpj,
} from '../schemas'

type Resources = { faqRepository: FaqRepository }

export async function updateCategory(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.put('/api/tenant/:cnpj/faq/category/:id', {
			schema: {
				tags: ['FAQ'],
				summary: 'Update FAQ category',
				params: paramsByCnpj.merge(idParam),
				body: categoryUpdateBody,
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
				const { tenant } = await req.getManagerMembership(req.params.cnpj)
				const { name } = req.body
				let cat: FaqCategoryFull
				if (name) {
					cat = await resources.faqRepository.updateCategory(
						tenant.id,
						req.params.id,
						name
					)
				} else {
					const current = await resources.faqRepository.getCategory(
						tenant.id,
						req.params.id
					)
					if (!current)
						throw AppError.notFound('NOT_FOUND', 'Categoria não encontrada.')
					cat = current
				}
				return reply.send(cat)
			},
		})
}
