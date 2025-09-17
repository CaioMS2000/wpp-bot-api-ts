import { AppError } from '@/infra/http/errors'
import type { DepartmentRepository } from '@/repository/DepartmentRepository'
import type { EmployeeRepository } from '@/repository/EmployeeRepository'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../../middlewares/auth'
import { departmentResponse, idParam, paramsByCnpj } from './schemas'

type Resources = {
	departmentRepository: DepartmentRepository
	employeeRepository: EmployeeRepository
}

export async function getDepartment(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get('/api/tenant/:cnpj/department/:id', {
			schema: {
				tags: ['Department'],
				summary: 'Get department by id',
				params: paramsByCnpj.merge(idParam),
				response: {
					...departmentResponse,
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
				const { tenant } = await req.getAdminMembership(req.params.cnpj)
				const dept = await resources.departmentRepository.get(
					tenant.id,
					req.params.id
				)
				if (!dept)
					throw AppError.notFound('NOT_FOUND', 'Departamento não encontrado.')
				// Fetch employees for this department to aid editing UI
				const emps = await resources.employeeRepository.listByDepartment(
					tenant.id,
					dept.id
				)
				return reply.send({
					...dept,
					employees: emps.map(e => ({ id: e.id, name: e.name })),
					totalEmployees: emps.length,
				})
			},
		})
}
