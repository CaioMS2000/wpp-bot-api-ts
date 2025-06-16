import { DepartmentRepository } from '@/domain/repositories/department-repository'

export class ListActiveDepartmentsUseCase {
    constructor(private departmentRepository: DepartmentRepository) {}

    async execute() {
        const departments = await this.departmentRepository.findAllActive()

        return departments
    }
}
