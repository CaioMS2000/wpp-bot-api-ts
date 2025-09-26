import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { AppError } from '@/infra/http/errors'
import { auth } from '../../../middlewares/auth'
import type { FaqRepository } from '@/repository/FaqRepository'
import {
	entryResponse,
	entryUpdateBody,
	idParam,
	paramsByCnpj,
} from '../schemas'

type Resources = { faqRepository: FaqRepository }

export async function updateEntry(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.put('/api/tenant/:cnpj/faq/entry/:id', {
			schema: {
				tags: ['FAQ'],
				summary: 'Update FAQ entry',
				params: paramsByCnpj.merge(idParam),
				body: entryUpdateBody,
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
				const { tenant } = await req.getManagerMembership(req.params.cnpj)
				const data = req.body
				// If empty, return current or 404
				if (!data.categoryId && !data.question && !data.answer) {
					const current = await resources.faqRepository.getEntry(
						tenant.id,
						req.params.id
					)
					if (!current)
						throw AppError.notFound(
							'NOT_FOUND',
							'Entrada de FAQ não encontrada.'
						)
					return reply.send(current)
				}
				const entry = await resources.faqRepository.updateEntry(
					tenant.id,
					req.params.id,
					data
				)
				return reply.send(entry)
			},
		})
}
