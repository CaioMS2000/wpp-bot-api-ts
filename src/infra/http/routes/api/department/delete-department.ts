import { departmentSchema } from '@/modules/web-api/@types/schemas'
import { DeleteDepartmentUseCase } from '@/modules/web-api/use-cases/delete-department-use-case'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	deleteDepartmentUseCase: DeleteDepartmentUseCase
}

export const paramsSchema = z.object({
	cnpj: z.string(),
	id: z.string(),
})

export const responseSchema = {
	204: z.null().describe('No Content'),
}

export async function deleteDepartment(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.delete(
			'/api/company/:cnpj/departments/:id',
			{
				schema: {
					tags: ['departments'],
					summary: 'Delete a department of a company',

					params: paramsSchema,
					response: responseSchema,
				},
			},
			async (request, reply) => {
				const { deleteDepartmentUseCase } = resources
				const { id, cnpj } = request.params
				const { company } = await request.getUserMembership(cnpj)

				await deleteDepartmentUseCase.execute(company.id, id)

				return reply.status(204).send()
			}
		)
}
