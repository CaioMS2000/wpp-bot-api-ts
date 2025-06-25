import { Company } from '@/domain/entities/company'
import { DepartmentRepository } from '@/domain/repositories/department-repository'

export class ListActiveDepartmentsUseCase {
    constructor(private departmentRepository: DepartmentRepository) {}

    async execute(company: Company) {
        const departments =
            await this.departmentRepository.findAllActive(company)

        return departments
    }
}
