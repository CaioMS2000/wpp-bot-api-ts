import type { DepartmentRepository } from '@/repository/DepartmentRepository'
import type { EmployeeRepository } from '@/repository/EmployeeRepository'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../../middlewares/auth'
import { createBody, departmentResponse, paramsByCnpj } from './schemas'

type Resources = {
	departmentRepository: DepartmentRepository
	employeeRepository: EmployeeRepository
}

export async function createDepartment(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post('/api/tenant/:cnpj/department', {
			schema: {
				tags: ['Department'],
				summary: 'Create a new department',
				params: paramsByCnpj,
				body: createBody,
				response: departmentResponse,
			},
			handler: async (req, reply) => {
				const { tenant } = await req.getManagerMembership(req.params.cnpj)
				const { name, description, leadEmployeeId, employees } = req.body
				const dept = await resources.departmentRepository.create(
					tenant.id,
					name,
					description ?? null
				)
				if (leadEmployeeId) {
					await resources.departmentRepository.assignEmployee(
						tenant.id,
						dept.id,
						leadEmployeeId
					)
				}
				if (Array.isArray(employees)) {
					const merged = [
						...employees,
						...(leadEmployeeId ? [leadEmployeeId] : []),
					]
					await resources.departmentRepository.replaceEmployees(
						tenant.id,
						dept.id,
						merged
					)
				}
				// Build response with employees + total
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
