import { Company } from '@/domain/entities/company'
import { Department } from '@/domain/entities/department'
import { Employee } from '@/domain/entities/employee'
import { Manager } from '@/domain/entities/manager'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'

export class InMemoryEmployeeRepository extends EmployeeRepository {
    private data: Record<string, Employee> = {}

    constructor() {
        super()

        this.seedInMemoryData()
    }

    async save(employee: Employee): Promise<void> {
        this.data[employee.phone] = employee
    }

    async findByPhone(phone: string): Promise<Nullable<Employee>> {
        return this.data[phone] ?? null
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
        const department = Department.create({
            name: 'Departamento de TI',
            company,
        })

        this.save(
            Employee.create({
                department,
                phone: '5562993765721',
                company,
                name: 'João Silva',
            })
        )
    }
}
