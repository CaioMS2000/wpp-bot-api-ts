import type { EmployeeRepository } from '@/repository/EmployeeRepository'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../../middlewares/auth'
import { idParam, paramsByCnpj } from './schemas'

type Resources = { employeeRepository: EmployeeRepository }

export async function deleteEmployee(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.delete('/api/tenant/:cnpj/employee/:id', {
			schema: {
				tags: ['Employee'],
				summary: 'Delete an employee',
				params: paramsByCnpj.merge(idParam),
			},
			handler: async (req, reply) => {
				const { tenant } = await req.getManagerMembership(req.params.cnpj)
				await resources.employeeRepository.remove(tenant.id, req.params.id)
				return reply.status(204).send()
			},
		})
}
