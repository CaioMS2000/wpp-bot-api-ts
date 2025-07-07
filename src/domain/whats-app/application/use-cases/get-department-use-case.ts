import { Company } from '@/domain/entities/company'
import { DepartmentRepository } from '@/domain/repositories/department-repository'

export class GetDepartmentUseCase {
    constructor(private departmentRepository: DepartmentRepository) {}

    async execute(company: Company, departmentName: string) {
        const departments = await this.departmentRepository.findByNameOrThrow(
            company,
            departmentName
        )

        return departments
    }
}
