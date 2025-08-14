import { DepartmentService } from '@/modules/whats-app/services/department-service'

export class GetDepartmentUseCase {
	constructor(private departmentService: DepartmentService) {}

	async execute(companyId: string, departmentId: string) {
		const department = await this.departmentService.findDepartment(
			companyId,
			departmentId,
			{ notNull: true }
		)

		const employees = await this.departmentService.getEmployees(
			companyId,
			departmentId
		)

		return {
			id: department.id,
			name: department.name,
			description: department.description,
			employees: employees.map(employee => ({
				name: employee.name,
				phone: employee.phone,
			})),
		}
	}
}
