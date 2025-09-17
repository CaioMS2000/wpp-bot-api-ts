import type { DepartmentRepository } from '@/repository/DepartmentRepository'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../../middlewares/auth'
import { idParam, paramsByCnpj } from './schemas'

type Resources = { departmentRepository: DepartmentRepository }

export async function deleteDepartment(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.delete('/api/tenant/:cnpj/department/:id', {
			schema: {
				tags: ['Department'],
				summary: 'Delete a department',
				params: paramsByCnpj.merge(idParam),
			},
			handler: async (req, reply) => {
				const { tenant } = await req.getAdminMembership(req.params.cnpj)
				await resources.departmentRepository.remove(tenant.id, req.params.id)
				return reply.status(204).send()
			},
		})
}
