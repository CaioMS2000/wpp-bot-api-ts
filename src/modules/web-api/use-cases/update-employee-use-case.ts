import { UserType } from '@/@types'
import { Employee } from '@/entities/employee'
import { DepartmentService } from '@/modules/whats-app/services/department-service'
import { UserService } from '@/modules/whats-app/services/user-service'

export class UpdateEmployeeUseCase {
	constructor(
		private userService: UserService,
		private departmentService: DepartmentService
	) {}

	async execute(
		companyId: string,
		phone: string,
		data: Partial<Parameters<typeof Employee.create>[0]>
	) {
		const employee = await this.userService.getEmployeeByPhone(companyId, phone)

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
			const department = await this.departmentService.findDepartment(
				companyId,
				data.departmentId,
				{ notNull: true }
			)

			employee.departmentId = department.id
		}

		await this.userService.save({ user: employee, userType: UserType.EMPLOYEE })
	}
}
