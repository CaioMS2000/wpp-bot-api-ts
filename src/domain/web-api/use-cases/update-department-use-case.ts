import { logger } from '@/core/logger'
import { Department } from '@/domain/entities/department'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'

export class UpdateDepartmentUseCase {
	constructor(
		private departmentRepository: DepartmentRepository,
		private employeeRepository: EmployeeRepository
	) {}

	async execute(
		companyId: string,
		id: string,
		data: Partial<Parameters<typeof Department.create>[0]> & {
			employeeId?: Nullable<string>
		}
	) {
		logger.debug('Updating department', { id, data })
		const department = await this.departmentRepository.findOrThrow(
			companyId,
			id
		)

		if (data.employeeId) {
			const employee = await this.employeeRepository.findOrThrow(
				companyId,
				data.employeeId
			)
			employee.departmentId = department.id

			await this.unAssignCurrentEmployee(companyId, department.id)
			await this.employeeRepository.save(employee)
		}

		if (data.employeeId === null) {
			await this.unAssignCurrentEmployee(companyId, department.id)
		}
	}

	private async unAssignCurrentEmployee(
		companyId: string,
		departmentId: string
	) {
		const currentDepartmentEmployee =
			await this.employeeRepository.findByDepartment(companyId, departmentId)

		if (currentDepartmentEmployee) {
			currentDepartmentEmployee.departmentId = null

			await this.employeeRepository.save(currentDepartmentEmployee)
		}
	}
}
