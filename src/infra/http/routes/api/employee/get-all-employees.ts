import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'
import { GetAllCompanyEmployeesUseCase } from '@/domain/web-api/use-cases/get-all-company-employees-use-case'

type Resources = {
	getAllCompanyEmployeesUseCase: GetAllCompanyEmployeesUseCase
}

export async function getAllEmployees(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			'/api/company/:cnpj/employees',
			{
				schema: {
					tags: ['employees'],
					summary: 'Get all employees of a company',
					security: [{ bearerAuth: [] }],
					params: z.object({
						cnpj: z.string(),
					}),
				},
			},
			async (request, reply) => {
				const { getAllCompanyEmployeesUseCase } = resources
				const { manager, company } = await request.getUserMembership(
					request.params.cnpj
				)
				const employees = await getAllCompanyEmployeesUseCase.execute(
					company.id
				)

				return reply.status(201).send({
					employees,
				})
			}
		)
}
