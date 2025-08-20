import { DepartmentService } from '@/modules/whats-app/services/department-service'

export class DeleteDepartmentUseCase {
	constructor(private departmentService: DepartmentService) {}

	async execute(companyId: string, departmentId: string) {
		await this.departmentService.deleteDepartment(companyId, departmentId)
	}
}
