import { Department } from '@/domain/entities/department'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'

type Props = Parameters<typeof Department.create>[0] & {
	employeeId?: Nullable<string>
}
export class CreateDepartmentUseCase {
	constructor(
		private departmentRepository: DepartmentRepository,
		private employeeRepository: EmployeeRepository
	) {}

	async execute(props: Props) {
		const department = Department.create(props)

		await this.departmentRepository.save(department)

		if (props.employeeId) {
			const employee = await this.employeeRepository.findOrThrow(
				props.companyId,
				props.employeeId
			)
			employee.departmentId = department.id

			await this.employeeRepository.save(employee)
		}

		return department
	}
}
