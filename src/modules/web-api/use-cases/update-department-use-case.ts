import { UserType } from '@/@types'
import { Department } from '@/entities/department'
import { logger } from '@/logger'
import { DepartmentService } from '@/modules/whats-app/services/department-service'
import { UserService } from '@/modules/whats-app/services/user-service'

export class UpdateDepartmentUseCase {
	constructor(
		private departmentService: DepartmentService,
		private userService: UserService
	) {}

	async execute(
		companyId: string,
		id: string,
		data: Partial<Parameters<typeof Department.create>[0]> & {
			employeeId?: Nullable<string>
		}
	) {
		logger.debug('Updating department', { id, data })
		const department = await this.departmentService.findDepartment(
			companyId,
			id,
			{ notNull: true }
		)

		if (data.employeeId) {
			const employee = await this.userService.getEmployee(
				companyId,
				data.employeeId,
				{ notNull: true }
			)
			employee.departmentId = department.id

			await this.unAssignCurrentEmployee(companyId, department.id)
			await this.userService.save({
				user: employee,
				userType: UserType.EMPLOYEE,
			})
		}

		if (data.employeeId === null) {
			await this.unAssignCurrentEmployee(companyId, department.id)
		}
	}

	private async unAssignCurrentEmployee(
		companyId: string,
		departmentId: string
	) {
		const currentDepartmentEmployee =
			await this.userService.getEmployeeByDepartment(companyId, departmentId)

		if (currentDepartmentEmployee) {
			currentDepartmentEmployee.departmentId = null

			await this.userService.save({
				user: currentDepartmentEmployee,
				userType: UserType.EMPLOYEE,
			})
		}
	}
}
