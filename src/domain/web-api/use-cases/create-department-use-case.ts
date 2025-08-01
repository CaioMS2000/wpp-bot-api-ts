import { Department } from '@/domain/entities/department'
import { DepartmentRepository } from '@/domain/repositories/department-repository'

export class CreateDepartmentUseCase {
	constructor(private readonly departmentRepository: DepartmentRepository) {}

	async execute(props: Parameters<typeof Department.create>[0]) {
		const department = Department.create(props)

		await this.departmentRepository.save(department)

		return department
	}
}
