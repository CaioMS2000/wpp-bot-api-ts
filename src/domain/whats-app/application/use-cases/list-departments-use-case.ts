import { DepartmentRepository } from '@/domain/repositories/department-repository'

export class ListDepartmentsUseCase {
    constructor(private departmentRepository: DepartmentRepository) {}

    async execute(): Promise<string[]> {
        const departments = await this.departmentRepository.findAllActive()

        return departments.map(d => d.name)
    }
}
