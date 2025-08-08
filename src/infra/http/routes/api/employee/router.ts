import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { ExtractResources } from '../@types'
import { createEmployee } from './create-employee'
import { getAllEmployees } from './get-all-employees'
import { getEmployee } from './get-employee'
import { updateEmployee } from './update-employee'

const routes = [
	getEmployee,
	getAllEmployees,
	createEmployee,
	updateEmployee,
] as const

type Resources = ExtractResources<typeof routes>

export const router = fastifyPlugin(
	async (app: FastifyInstance, resources: Resources) => {
		app.register(getEmployee, {
			getEmployeeByPhoneUseCase: resources.getEmployeeByPhoneUseCase,
		})
		app.register(getAllEmployees, {
			getAllCompanyEmployeesUseCase: resources.getAllCompanyEmployeesUseCase,
		})
		app.register(createEmployee, {
			createEmployeeUseCase: resources.createEmployeeUseCase,
		})
		app.register(updateEmployee, {
			updateEmployeeUseCase: resources.updateEmployeeUseCase,
		})
	}
)
