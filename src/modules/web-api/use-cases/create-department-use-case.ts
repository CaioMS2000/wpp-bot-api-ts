import { UserType } from '@/@types'
import { Department } from '@/entities/department'
import { DepartmentService } from '@/modules/whats-app/services/department-service'
import { UserService } from '@/modules/whats-app/services/user-service'

type Props = Parameters<typeof Department.create>[0] & {
	employeeId?: Nullable<string>
}
export class CreateDepartmentUseCase {
	constructor(
		private departmentService: DepartmentService,
		private userService: UserService
	) {}

	async execute(props: Props) {
		const department = Department.create(props)

		await this.departmentService.save(department)

		if (props.employeeId) {
			const employee = await this.userService.getEmployee(
				props.companyId,
				props.employeeId,
				{ notNull: true }
			)
			employee.departmentId = department.id

			await this.userService.save({
				user: employee,
				userType: UserType.EMPLOYEE,
			})
		}

		return department
	}
}
