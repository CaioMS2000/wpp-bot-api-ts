import { departmentSchema } from '@/modules/web-api/@types/schemas'
import { GetDepartmentUseCase } from '@/modules/web-api/use-cases/get-department-use-case'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	getDepartmentUseCase: GetDepartmentUseCase
}

export const paramsSchema = z.object({
	cnpj: z.string(),
	id: z.string(),
})

export const responseSchema = {
	200: z.object({
		department: departmentSchema.extend({
			employees: z.array(
				z.object({
					name: z.string(),
					phone: z.string(),
				})
			),
		}),
	}),
}

export async function getDepartment(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			'/api/company/:cnpj/department/:id',
			{
				schema: {
					tags: ['departments'],
					summary: 'Get a department of a company',
					security: [{ bearerAuth: [] }],
					params: paramsSchema,
					response: responseSchema,
				},
			},
			async (request, reply) => {
				const { getDepartmentUseCase } = resources
				const { id, cnpj } = request.params
				const { company } = await request.getUserMembership(cnpj)
				const department = await getDepartmentUseCase.execute(company.id, id)

				return reply.status(200).send({
					department,
				})
			}
		)
}
