import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'
import { DeleteFAQItemUseCase } from '@/domain/web-api/use-cases/delete-faq-item-use-case'

type Resources = {
	deleteFAQItemUseCase: DeleteFAQItemUseCase
}

export const paramsSchema = z.object({
	cnpj: z.string(),
	categoryId: z.string(),
	itemId: z.string(),
})

export const responseSchema = {
	200: z.null(),
}
export async function deleteFAQItem(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.delete(
			'/api/company/:cnpj/faqs/:categoryId/:itemId',
			{
				schema: {
					tags: ['faqs'],
					summary: 'Deletar um FAQ da empresa',
					security: [{ bearerAuth: [] }],
					params: paramsSchema,
					response: responseSchema,
				},
			},
			async (request, reply) => {
				const { deleteFAQItemUseCase } = resources
				const { categoryId, itemId } = request.params
				const { company } = await request.getUserMembership(request.params.cnpj)

				await deleteFAQItemUseCase.execute(company.id, categoryId, itemId)

				return reply.status(200).send()
			}
		)
}
