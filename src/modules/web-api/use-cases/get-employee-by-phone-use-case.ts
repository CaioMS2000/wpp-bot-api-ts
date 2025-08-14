import { DepartmentService } from '@/modules/whats-app/services/department-service'
import { UserService } from '@/modules/whats-app/services/user-service'

export class GetEmployeeByPhoneUseCase {
	constructor(
		private userService: UserService,
		private departmentService: DepartmentService
	) {}

	async execute(companyId: string, phone: string) {
		const employee = await this.userService.getEmployee(companyId, phone, {
			notNull: true,
		})
		let departmentName: Nullable<string> = null

		if (employee.departmentId) {
			const department = await this.departmentService.findDepartment(
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
