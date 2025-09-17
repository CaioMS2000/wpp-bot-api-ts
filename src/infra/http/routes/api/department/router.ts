import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { ExtractResources } from '../../@types'
import { createDepartment } from './create-department'
import { deleteDepartment } from './delete-department'
import { getDepartment } from './get-department'
import { listDepartments } from './list-departments'
import { updateDepartment } from './update-department'

const routes = [
	createDepartment,
	updateDepartment,
	getDepartment,
	listDepartments,
	deleteDepartment,
] as const
type Resources = ExtractResources<typeof routes>

export const router = fastifyPlugin(
	async (app: FastifyInstance, resources: Resources) => {
		app.register(createDepartment, {
			departmentRepository: resources.departmentRepository,
			employeeRepository: resources.employeeRepository,
		})
		app.register(updateDepartment, {
			departmentRepository: resources.departmentRepository,
			employeeRepository: resources.employeeRepository,
		})
		app.register(getDepartment, {
			departmentRepository: resources.departmentRepository,
			employeeRepository: resources.employeeRepository,
		})
		app.register(listDepartments, {
			departmentRepository: resources.departmentRepository,
		})
		app.register(deleteDepartment, {
			departmentRepository: resources.departmentRepository,
		})
	}
)
