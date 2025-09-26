import type { EmployeeRepository } from '@/repository/EmployeeRepository'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../../middlewares/auth'
import { employeeResponse, idParam, paramsByCnpj, updateBody } from './schemas'

type Resources = { employeeRepository: EmployeeRepository }

export async function updateEmployee(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.put('/api/tenant/:cnpj/employee/:id', {
			schema: {
				tags: ['Employee'],
				summary: 'Update an employee',
				params: paramsByCnpj.merge(idParam),
				body: updateBody,
				response: employeeResponse,
			},
			handler: async (req, reply) => {
				const { tenant } = await req.getManagerMembership(req.params.cnpj)
				const emp = await resources.employeeRepository.update(
					tenant.id,
					req.params.id,
					req.body
				)
				return reply.send(emp)
			},
		})
}
