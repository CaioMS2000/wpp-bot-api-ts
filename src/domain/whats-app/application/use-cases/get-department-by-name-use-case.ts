import { Company } from '@/domain/entities/company'
import { DepartmentRepository } from '@/domain/repositories/department-repository'

export class GetDepartmentByNameUseCase {
	constructor(private departmentRepository: DepartmentRepository) {}

	async execute(companyId: string, departmentName: string) {
		const departments = await this.departmentRepository.findByNameOrThrow(
			companyId,
			departmentName
		)

		return departments
	}
}
