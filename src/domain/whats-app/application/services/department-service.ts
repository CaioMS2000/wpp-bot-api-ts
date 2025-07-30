import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'

export class DepartmentService {
	constructor(
		private departmentRepository: DepartmentRepository,
		private employeeRepository: EmployeeRepository
	) {}

	async listEmployees(companyId: string, departmentId: string) {
		const department = await this.departmentRepository.findOrThrow(
			companyId,
			departmentId
		)

		return this.employeeRepository.findAllByDepartment(
			department.companyId,
			department.id
		)
	}

	async getFirstEmployee(companyId: string, departmentId: string) {
		const employees = await this.listEmployees(companyId, departmentId)
		const employee = employees.at(0)

		if (!employee) {
			throw new Error('Department has no employees')
		}

		return employee
	}
}
