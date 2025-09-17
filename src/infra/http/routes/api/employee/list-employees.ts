import type { EmployeeRepository } from '@/repository/EmployeeRepository'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../../middlewares/auth'
import { employeeListResponse, paramsByCnpj } from './schemas'

type Resources = { employeeRepository: EmployeeRepository }

export async function listEmployees(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get('/api/tenant/:cnpj/employee', {
			schema: {
				tags: ['Employee'],
				summary: 'List employees',
				params: paramsByCnpj,
				response: employeeListResponse,
			},
			handler: async (req, reply) => {
				const { tenant } = await req.getAdminMembership(req.params.cnpj)
				const items = await resources.employeeRepository.list(tenant.id)
				return reply.send({ items })
			},
		})
}
