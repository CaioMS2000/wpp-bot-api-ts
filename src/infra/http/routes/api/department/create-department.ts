import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'
import { CreateDepartmentUseCase } from '@/domain/web-api/use-cases/create-department-use-case'
import { createDepartmentSchema } from '@/domain/web-api/@types/schemas'

type Resources = {
	createDepartmentUseCase: CreateDepartmentUseCase
}

export async function createDepartment(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post(
			'/api/company/:cnpj/departments',
			{
				schema: {
					tags: ['departments'],
					summary: 'Create Department',
					security: [{ bearerAuth: [] }],
					params: z.object({
						cnpj: z.string(),
					}),
					body: createDepartmentSchema,
				},
			},
			async (request, reply) => {
				const { createDepartmentUseCase } = resources
				const { cnpj } = request.params
				const { company } = await request.getUserMembership(cnpj)
				const department = await createDepartmentUseCase.execute({
					...request.body,
					companyId: company.id,
				})

				return reply.status(200).send({
					department,
				})
			}
		)
}
