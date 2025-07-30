import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { DepartmentService } from '@/domain/whats-app/application/services/department-service'

export class GetDepartmentUseCase {
	constructor(
		private departmentRepository: DepartmentRepository,
		private departmentService: DepartmentService
	) {}

	async execute(companyId: string, departmentId: string) {
		const department = await this.departmentRepository.findOrThrow(
			companyId,
			departmentId
		)

		const employees = await this.departmentService.listEmployees(
			companyId,
			departmentId
		)

		return {
			name: department.name,
			description: department.description,
			employees: employees.map(employee => ({
				name: employee.name,
				phone: employee.phone,
			})),
		}
	}
}
