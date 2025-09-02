import { UpdateFAQItemUseCase } from '@/modules/web-api/use-cases/update-faq-item-use-case'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	updateFAQItemUseCase: UpdateFAQItemUseCase
}

export const paramsSchema = z.object({
	cnpj: z.string(),
	categoryId: z.string(),
	itemId: z.string(),
})

export const bodySchema = z.object({
	category: z.string(),
	question: z.string(),
	answer: z.string(),
})

export const responseSchema = {
	201: z.object({
		faq: z.object({
			id: z.string(),
			category: z.string(),
			question: z.string(),
			answer: z.string(),
		}),
	}),
}
export async function updateFAQItem(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.put(
			'/api/company/:cnpj/faqs/:categoryId/:itemId',
			{
				schema: {
					tags: ['faqs'],
					summary: 'Criar um FAQ para a empresa',

					params: paramsSchema,
					body: bodySchema,
					response: responseSchema,
				},
			},
			async (request, reply) => {
				const { updateFAQItemUseCase } = resources
				const { categoryId, itemId } = request.params
				const { company } = await request.getUserMembership(request.params.cnpj)
				const { category, question, answer } = request.body
				const faq = await updateFAQItemUseCase.execute(
					company.id,
					categoryId,
					itemId,
					category,
					question,
					answer
				)

				return reply.status(201).send({ faq })
			}
		)
}
