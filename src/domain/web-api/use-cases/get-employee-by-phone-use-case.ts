import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'

export class GetEmployeeByPhoneUseCase {
	constructor(
		private employeeRepository: EmployeeRepository,
		private departmentRepository: DepartmentRepository
	) {}

	async execute(companyId: string, phone: string) {
		const employee = await this.employeeRepository.findByPhone(companyId, phone)
		let departmentName: Nullable<string> = null

		if (!employee) {
			throw new Error('Employee not found')
		}

		if (employee.departmentId) {
			const department = await this.departmentRepository.find(
				companyId,
				employee.departmentId
			)

			if (department) {
				departmentName = department.name
			}
		}

		return {
			name: employee.name,
			phone: employee.phone,
			departmentName,
		}
	}
}
