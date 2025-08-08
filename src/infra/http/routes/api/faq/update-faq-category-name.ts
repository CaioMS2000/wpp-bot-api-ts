import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'
import { UpdateFAQCategoryNameUseCase } from '@/domain/web-api/use-cases/update-faq-category-name-use-case'

type Resources = {
	updateFAQCategoryNameUseCase: UpdateFAQCategoryNameUseCase
}

export const paramsSchema = z.object({
	cnpj: z.string(),
	categoryId: z.string(),
})

export const bodySchema = z.object({
	name: z.string(),
})

export const responseSchema = {
	200: z.null(),
}
export async function updateFAQCategoryName(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.put(
			'/api/company/:cnpj/faqs/:categoryId',
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
				const { updateFAQCategoryNameUseCase } = resources
				const { categoryId } = request.params
				const { company } = await request.getUserMembership(request.params.cnpj)
				const { name } = request.body

				await updateFAQCategoryNameUseCase.execute(company.id, categoryId, name)

				return reply.status(201).send()
			}
		)
}
