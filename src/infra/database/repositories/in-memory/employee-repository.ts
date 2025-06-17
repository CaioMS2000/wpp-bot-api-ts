import { Employee } from '@/domain/entities/employee'
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
        this.save(
            Employee.create({
                department: 'Departamento de TI',
                phone: '5562993765721',
            })
        )
    }
}
