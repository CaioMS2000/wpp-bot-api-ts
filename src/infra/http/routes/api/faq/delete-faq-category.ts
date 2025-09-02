import { DeleteFAQCategoryUseCase } from '@/modules/web-api/use-cases/delete-faq-category-use-case'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	deleteFAQCategoryUseCase: DeleteFAQCategoryUseCase
}

export const paramsSchema = z.object({
	cnpj: z.string(),
	categoryId: z.string(),
})

export const responseSchema = {
	204: z.null().describe('No Content'),
}
export async function deleteFAQCategory(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.delete(
			'/api/company/:cnpj/faqs/:categoryId',
			{
				schema: {
					tags: ['faqs'],
					summary: 'Deletar uma categoria de FAQ da empresa',

					params: paramsSchema,
					response: responseSchema,
				},
			},
			async (request, reply) => {
				const { deleteFAQCategoryUseCase } = resources
				const { categoryId } = request.params
				const { company } = await request.getUserMembership(request.params.cnpj)

				await deleteFAQCategoryUseCase.execute(company.id, categoryId)

				return reply.status(204).send()
			}
		)
}
