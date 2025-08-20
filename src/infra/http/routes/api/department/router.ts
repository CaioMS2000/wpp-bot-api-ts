import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { ExtractResources } from '../@types'
import { createDepartment } from './create-department'
import { deleteDepartment } from './delete-department'
import { getAllDepartments } from './get-all-departments'
import { getDepartment } from './get-department'
import { updateDepartment } from './update-department'

const routes = [
	updateDepartment,
	getDepartment,
	getAllDepartments,
	createDepartment,
	deleteDepartment,
] as const

type Resources = ExtractResources<typeof routes>

export const router = fastifyPlugin(
	async (app: FastifyInstance, resources: Resources) => {
		app.register(updateDepartment, {
			updateDepartmentUseCase: resources.updateDepartmentUseCase,
		})
		app.register(getDepartment, {
			getDepartmentUseCase: resources.getDepartmentUseCase,
		})
		app.register(getAllDepartments, {
			getCompanyDepartmentsUseCase: resources.getCompanyDepartmentsUseCase,
		})
		app.register(createDepartment, {
			createDepartmentUseCase: resources.createDepartmentUseCase,
		})
		app.register(deleteDepartment, {
			deleteDepartmentUseCase: resources.deleteDepartmentUseCase,
		})
	}
)
