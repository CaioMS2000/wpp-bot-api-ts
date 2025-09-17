import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { ExtractResources } from '../../@types'
import { createEmployee } from './create-employee'
import { deleteEmployee } from './delete-employee'
import { getEmployee } from './get-employee'
import { listEmployees } from './list-employees'
import { updateEmployee } from './update-employee'

const routes = [
	createEmployee,
	updateEmployee,
	getEmployee,
	listEmployees,
	deleteEmployee,
] as const
type Resources = ExtractResources<typeof routes>

export const router = fastifyPlugin(
	async (app: FastifyInstance, resources: Resources) => {
		app.register(createEmployee, {
			employeeRepository: resources.employeeRepository,
		})
		app.register(updateEmployee, {
			employeeRepository: resources.employeeRepository,
		})
		app.register(getEmployee, {
			employeeRepository: resources.employeeRepository,
		})
		app.register(listEmployees, {
			employeeRepository: resources.employeeRepository,
		})
		app.register(deleteEmployee, {
			employeeRepository: resources.employeeRepository,
		})
	}
)
