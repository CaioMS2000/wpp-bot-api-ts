import { CreateFAQUseCase } from '@/domain/web-api/use-cases/create-faq-use-case'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	createFAQUseCase: CreateFAQUseCase
}

export const paramsSchema = z.object({
	cnpj: z.string(),
})

export const bodySchema = z.object({
	category: z.string(),
	question: z.string(),
	answer: z.string(),
})

export const responseSchema = {
	201: z.object({
		faq: z.object({
			categoryName: z.string(),
			categoryId: z.string(),
			itemId: z.string(),
			question: z.string(),
			answer: z.string(),
		}),
	}),
}
export async function createFAQ(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post(
			'/api/company/:cnpj/faqs',
			{
				schema: {
					tags: ['faqs'],
					summary: 'Criar um FAQ para a empresa',
					security: [{ bearerAuth: [] }],
					params: paramsSchema,
					body: bodySchema,
					response: responseSchema,
				},
			},
			async (request, reply) => {
				const { createFAQUseCase } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)
				const { category, question, answer } = request.body
				const faq = await createFAQUseCase.execute(
					company.id,
					category,
					question,
					answer
				)

				return reply.status(201).send({
					faq: {
						categoryName: faq.categoryName,
						categoryId: faq.categoryId,
						itemId: faq.itemId,
						question: faq.question,
						answer: faq.answer,
					},
				})
			}
		)
}
