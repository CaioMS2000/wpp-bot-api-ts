import { GetEmployeeByPhoneUseCase } from '@/modules/web-api/use-cases/get-employee-by-phone-use-case'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	getEmployeeByPhoneUseCase: GetEmployeeByPhoneUseCase
}

export const paramsSchema = z.object({
	cnpj: z.string(),
	phone: z.string(),
})

export const responseSchema = {
	200: z.object({
		employee: z.object({
			name: z.string(),
			phone: z.string(),
			departmentName: z.string().nullable(),
		}),
	}),
}

export async function getEmployee(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			'/api/company/:cnpj/employee/:phone',
			{
				schema: {
					tags: ['employees'],
					summary: 'Get an employee of a company',

					params: paramsSchema,
					response: responseSchema,
				},
			},
			async (request, reply) => {
				const { getEmployeeByPhoneUseCase } = resources
				const { company } = await request.getUserMembership(request.params.cnpj)
				const { phone } = request.params
				const employee = await getEmployeeByPhoneUseCase.execute(
					company.id,
					phone
				)

				return reply.status(200).send({
					employee,
				})
			}
		)
}
