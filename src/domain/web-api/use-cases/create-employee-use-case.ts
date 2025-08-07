import { Department } from '@/domain/entities/department'
import { Employee } from '@/domain/entities/employee'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'

export class CreateEmployeeUseCase {
	constructor(
		private readonly employeeRepository: EmployeeRepository,
		private readonly departmentRepository: DepartmentRepository
	) {}

	async execute(data: Parameters<typeof Employee.create>[0]) {
		const employee = Employee.create(data)
		let department: Nullable<Department> = null

		await this.employeeRepository.save(employee)

		if (employee.departmentId) {
			department = await this.departmentRepository.findOrThrow(
				employee.companyId,
				employee.departmentId
			)
		}

		return { employee, department }
	}
}
