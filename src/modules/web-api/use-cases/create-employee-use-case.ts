import { UserType } from '@/@types'
import { Department } from '@/entities/department'
import { Employee } from '@/entities/employee'
import { DepartmentService } from '@/modules/whats-app/services/department-service'
import { UserService } from '@/modules/whats-app/services/user-service'

export class CreateEmployeeUseCase {
	constructor(
		private readonly userService: UserService,
		private readonly departmentService: DepartmentService
	) {}

	async execute(data: Parameters<typeof Employee.create>[0]) {
		const employee = Employee.create(data)
		let department: Nullable<Department> = null

		await this.userService.save({ user: employee, userType: UserType.EMPLOYEE })

		if (employee.departmentId) {
			department = await this.departmentService.findDepartment(
				employee.companyId,
				employee.departmentId,
				{ notNull: true }
			)
		}

		return { employee, department }
	}
}
