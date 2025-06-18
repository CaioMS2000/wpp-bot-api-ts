import { Company } from '@/domain/entities/company'
import { Department } from '@/domain/entities/department'
import { Manager } from '@/domain/entities/manager'
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
        const manager = Manager.create({
            name: 'Eugenio Garcia',
            email: 'manager@evolight.com',
        })
        const company = Company.create({
            name: 'Evolight',
            phone: '556236266103',
            cnpj: '99999999999999',
            manager,
        })
        await this.save(
            Department.create({
                name: 'Departamento de TI',
                company,
                // queue: []
            })
        )
        await this.save(
            Department.create({
                name: 'Departamento de Vendas',
                company,
            })
        )
    }
}
