import { Company } from '@/domain/entities/company'
import { DepartmentRepository } from '@/domain/repositories/department-repository'

export class ListActiveDepartmentsUseCase {
	constructor(private departmentRepository: DepartmentRepository) {}

	async execute(companyId: string) {
		const departments = await this.departmentRepository.findAll(companyId)

		return departments
	}
}
