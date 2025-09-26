import { AppError } from '@/infra/http/errors'
import type { EmployeeRepository } from '@/repository/EmployeeRepository'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../../middlewares/auth'
import { employeeResponse, idParam, paramsByCnpj } from './schemas'

type Resources = { employeeRepository: EmployeeRepository }

export async function getEmployee(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get('/api/tenant/:cnpj/employee/:id', {
			schema: {
				tags: ['Employee'],
				summary: 'Get employee by id',
				params: paramsByCnpj.merge(idParam),
				response: {
					200: employeeResponse[200],
					404: z.object({
						error: z.object({
							code: z.string(),
							message: z.string(),
							hint: z.string().optional(),
							details: z.any().optional(),
						}),
					}),
				},
			},
			handler: async (req, reply) => {
				const { tenant } = await req.getManagerMembership(req.params.cnpj)
				const emp = await resources.employeeRepository.get(
					tenant.id,
					req.params.id
				)
				if (!emp)
					throw AppError.notFound('NOT_FOUND', 'Funcionário não encontrado.')
				return reply.send(emp)
			},
		})
}
