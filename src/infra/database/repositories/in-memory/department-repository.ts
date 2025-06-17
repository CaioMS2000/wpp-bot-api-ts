import { Department } from '@/domain/entities/department'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { createSlug } from '@/utils/text'

export class InMemoryDepartmentRepository extends DepartmentRepository {
    private data: Record<string, Department> = {}

    constructor() {
        super()

        this.seedInMemoryData()
    }

    async save(department: Department): Promise<void> {
        this.data[createSlug(department.name)] = department
    }

    async findAllActive(): Promise<Department[]> {
        return Object.values(this.data)
    }

    private async seedInMemoryData() {
        await this.save(
            Department.create({
                name: 'Departamento de TI',
            })
        )
        await this.save(
            Department.create({
                name: 'Departamento de Vendas',
            })
        )
    }
}
