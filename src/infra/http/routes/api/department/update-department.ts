import { AppError } from '@/infra/http/errors'
import type { DepartmentRepository } from '@/repository/DepartmentRepository'
import type { EmployeeRepository } from '@/repository/EmployeeRepository'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../../middlewares/auth'
import {
	departmentResponse,
	idParam,
	paramsByCnpj,
	updateBody,
} from './schemas'

type Resources = {
	departmentRepository: DepartmentRepository
	employeeRepository: EmployeeRepository
}

export async function updateDepartment(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.put('/api/tenant/:cnpj/department/:id', {
			schema: {
				tags: ['Department'],
				summary: 'Update a department',
				params: paramsByCnpj.merge(idParam),
				body: updateBody,
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
				const { tenant } = await req.getManagerMembership(req.params.cnpj)
				const { name, description, leadEmployeeId, employees } = req.body
				let dept
				if (
					name !== undefined ||
					Object.prototype.hasOwnProperty.call(req.body, 'description')
				) {
					const data: { name?: string; description?: string | null } = {}
					if (name !== undefined) data.name = name
					if (Object.prototype.hasOwnProperty.call(req.body, 'description'))
						data.description = description ?? null
					dept = await resources.departmentRepository.update(
						tenant.id,
						req.params.id,
						data
					)
				} else {
					const current = await resources.departmentRepository.get(
						tenant.id,
						req.params.id
					)
					if (!current)
						throw AppError.notFound('NOT_FOUND', 'Departamento não encontrado.')
					dept = current
				}
				if (leadEmployeeId !== undefined) {
					await resources.departmentRepository.assignEmployee(
						tenant.id,
						req.params.id,
						leadEmployeeId ?? null
					)
				}
				if (Array.isArray(employees)) {
					const merged = [
						...employees,
						...(leadEmployeeId ? [leadEmployeeId] : []),
					]
					await resources.departmentRepository.replaceEmployees(
						tenant.id,
						req.params.id,
						merged
					)
				}
				const emps = await resources.employeeRepository.listByDepartment(
					tenant.id,
					req.params.id
				)
				return reply.send({
					...dept,
					employees: emps.map(e => ({ id: e.id, name: e.name })),
					totalEmployees: emps.length,
				})
			},
		})
}
