import { Department } from '@/domain/entities/department'
import { DepartmentRepository } from '@/domain/repositories/department-repositorie'
import { createSlug } from '@/utils/text'

export class InMemoryDepartmentRepository extends DepartmentRepository {
    private data: Record<string, Department> = {}

    async save(department: Department): Promise<void> {
        this.data[createSlug(department.name)] = department
    }

    async findAllActive(): Promise<Department[]> {
        return Object.values(this.data)
    }
}
