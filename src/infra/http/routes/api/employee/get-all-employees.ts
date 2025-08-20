import { GetAllCompanyEmployeesUseCase } from '@/modules/web-api/use-cases/get-all-company-employees-use-case'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	getAllCompanyEmployeesUseCase: GetAllCompanyEmployeesUseCase
}

export const paramsSchema = z.object({
	cnpj: z.string(),
})

export const responseSchema = {
	200: z.object({
		employees: z.array(
			z.object({
				name: z.string(),
				departmentName: z.string(),
				phone: z.string(),
				available: z.boolean(),
				email: z.string(),
				totalChats: z.number(),
			})
		),
	}),
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
					params: paramsSchema,
					response: responseSchema,
				},
			},
			async (request, reply) => {
				const { getAllCompanyEmployeesUseCase } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)
				const employees = await getAllCompanyEmployeesUseCase.execute(
					company.id
				)

				return reply.status(200).send({
					employees,
				})
			}
		)
}
