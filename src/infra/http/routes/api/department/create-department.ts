import { departmentSchema } from '@/modules/web-api/@types/schemas'
import { CreateDepartmentUseCase } from '@/modules/web-api/use-cases/create-department-use-case'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	createDepartmentUseCase: CreateDepartmentUseCase
}

export const paramsSchema = z.object({
	cnpj: z.string(),
})

export const bodySchema = z.object({
	name: z.string().min(1, 'Name is required'),
	description: z.string().optional(),
})

export const responseSchema = {
	200: z.object({
		department: departmentSchema,
	}),
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
					params: paramsSchema,
					body: bodySchema,
					response: responseSchema,
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
