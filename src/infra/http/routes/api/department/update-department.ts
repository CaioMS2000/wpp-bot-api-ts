import { UpdateDepartmentUseCase } from '@/modules/web-api/use-cases/update-department-use-case'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	updateDepartmentUseCase: UpdateDepartmentUseCase
}

export const paramsSchema = z.object({
	id: z.string(),
	cnpj: z.string(),
})

export const bodySchema = z.object({
	name: z.string().optional(),
	description: z.string().optional(),
	employeeId: z.string().nullable().optional(),
})

export async function updateDepartment(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.put(
			'/api/company/:cnpj/departments/:id',
			{
				schema: {
					tags: ['departments'],
					summary: 'Update Department',
					security: [{ bearerAuth: [] }],
					params: paramsSchema,
					body: bodySchema,
					response: { 204: z.null() },
				},
			},
			async (request, reply) => {
				const { updateDepartmentUseCase } = resources
				const { id, cnpj } = request.params
				const { company } = await request.getUserMembership(cnpj)

				await updateDepartmentUseCase.execute(company.id, id, {
					...request.body,
					companyId: company.id,
				})

				return reply.status(204).send()
			}
		)
}
