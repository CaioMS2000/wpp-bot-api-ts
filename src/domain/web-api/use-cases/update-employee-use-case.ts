import { Employee } from '@/domain/entities/employee'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'

export class UpdateEmployeeUseCase {
	constructor(
		private employeeRepository: EmployeeRepository,
		private departmentRepository: DepartmentRepository
	) {}

	async execute(
		companyId: string,
		phone: string,
		data: Partial<Parameters<typeof Employee.create>[0]>
	) {
		const employee = await this.employeeRepository.findByPhone(companyId, phone)

		if (!employee) {
			throw new Error('Employee not found')
		}

		if (data.name) {
			employee.name = data.name
		}

		if (data.phone) {
			employee.phone = data.phone
		}

		if (data.departmentId) {
			const department = await this.departmentRepository.findOrThrow(
				companyId,
				data.departmentId
			)

			employee.departmentId = department.id
		}

		await this.employeeRepository.save(employee)
	}
}
