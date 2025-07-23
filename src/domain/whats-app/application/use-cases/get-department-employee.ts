import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'

export class GetDepartmentEmployeeUseCase {
	constructor(
		private departmentRepository: DepartmentRepository,
		private employeeRepository: EmployeeRepository
	) {}

	async execute(companyId: string, departmentId: string) {
		const department = await this.departmentRepository.findOrThrow(
			companyId,
			departmentId
		)
		const employeeId = department.employees.at(0)

		if (!employeeId) {
			throw new Error('Department has no employees')
		}

		return this.employeeRepository.findOrThrow(employeeId)
	}
}
