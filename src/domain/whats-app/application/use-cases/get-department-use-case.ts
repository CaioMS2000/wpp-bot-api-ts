import { Company } from '@/domain/entities/company'
import { DepartmentRepository } from '@/domain/repositories/department-repository'

export class GetDepartmentUseCase {
	constructor(private departmentRepository: DepartmentRepository) {}

	async execute(companyId: string, departmentId: string) {
		const department = await this.departmentRepository.find(
			companyId,
			departmentId
		)

		if (!department) {
			throw new Error('Department not found')
		}

		return department
	}
}
