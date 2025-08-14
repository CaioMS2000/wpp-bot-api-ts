import { DepartmentService } from '@/modules/whats-app/services/department-service'

export class GetCompanyDepartmentsUseCase {
	constructor(private departmentService: DepartmentService) {}

	async execute(companyId: string) {
		const departments =
			await this.departmentService.findAllDepartments(companyId)
		return departments
	}
}
