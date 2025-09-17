import type { DepartmentRepository } from '@/repository/DepartmentRepository'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../../middlewares/auth'
import { departmentListResponse, paramsByCnpj } from './schemas'

type Resources = { departmentRepository: DepartmentRepository }

export async function listDepartments(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get('/api/tenant/:cnpj/department', {
			schema: {
				tags: ['Department'],
				summary: 'List departments',
				params: paramsByCnpj,
				response: departmentListResponse,
			},
			handler: async (req, reply) => {
				const { tenant } = await req.getAdminMembership(req.params.cnpj)
				const items = await resources.departmentRepository.list(tenant.id)
				return reply.send({ items })
			},
		})
}
