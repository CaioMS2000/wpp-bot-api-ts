import { Employee } from '../entities/employee'

export abstract class EmployeeRepository {
    abstract save(employee: Employee): Promise<void>
    abstract findByPhone(phone: string): Promise<Nullable<Employee>>
}
