import { UpdateEmployeeUseCase } from '@/modules/web-api/use-cases/update-employee-use-case'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	updateEmployeeUseCase: UpdateEmployeeUseCase
}

export const paramsSchema = z.object({
	cnpj: z.string(),
	phone: z.string(),
})

const bodySchema = z.object({
	name: z.string().optional(),
	phone: z.string().optional(),
	departmentId: z.string().nullable().optional(),
})

export const responseSchema = {
	204: z.null().describe('No Content'),
}

export async function updateEmployee(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.put(
			'/api/company/:cnpj/employees/:phone',
			{
				schema: {
					tags: ['employees'],
					summary: 'Update an employee of a company',

					params: paramsSchema,
					response: responseSchema,
					body: bodySchema,
				},
			},
			async (request, reply) => {
				const { updateEmployeeUseCase } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)
				const { phone } = request.params

				await updateEmployeeUseCase.execute(company.id, phone, request.body)

				return reply.status(204).send()
			}
		)
}
