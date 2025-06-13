import { Employee } from '@/domain/entities/employee'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'

export class InMemoryEmployeeRepository extends EmployeeRepository {
    private data: Record<string, Employee> = {}

    async save(employee: Employee): Promise<void> {
        this.data[employee.phone] = employee
    }

    async findByPhone(phone: string): Promise<Nullable<Employee>> {
        return this.data[phone] ?? null
    }
}
