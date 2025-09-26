import type { EmployeeRepository } from '@/repository/EmployeeRepository'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../../middlewares/auth'
import { createBody, employeeResponse, paramsByCnpj } from './schemas'

type Resources = { employeeRepository: EmployeeRepository }

export async function createEmployee(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post('/api/tenant/:cnpj/employee', {
			schema: {
				tags: ['Employee'],
				summary: 'Create a new employee',
				params: paramsByCnpj,
				body: createBody,
				response: employeeResponse,
			},
			handler: async (req, reply) => {
				const { tenant } = await req.getManagerMembership(req.params.cnpj)
				const { name, phone, departmentName } = req.body
				const emp = await resources.employeeRepository.create(
					tenant.id,
					name,
					phone,
					departmentName ?? null
				)
				return reply.send(emp)
			},
		})
}
