import { GetCompanyDepartmentsUseCase } from '@/domain/web-api/use-cases/get-company-departments-use-case'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'
import { departmentSchema } from '@/domain/web-api/@types/schemas'

type Resources = {
	getCompanyDepartmentsUseCase: GetCompanyDepartmentsUseCase
}

export const paramsSchema = z.object({
	cnpj: z.string(),
})

export const responseSchema = {
	200: z.object({
		departments: z.array(departmentSchema),
	}),
}

export async function getAllDepartments(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			'/api/company/:cnpj/departments',
			{
				schema: {
					tags: ['departments'],
					summary: 'Get all departments of a company',
					security: [{ bearerAuth: [] }],
					params: paramsSchema,
					response: responseSchema,
				},
			},
			async (request, reply) => {
				const { getCompanyDepartmentsUseCase } = resources
				const { manager, company } = await request.getUserMembership(
					request.params.cnpj
				)
				const departments = await getCompanyDepartmentsUseCase.execute(
					company.id
				)

				return reply.status(200).send({
					departments,
				})
			}
		)
}
