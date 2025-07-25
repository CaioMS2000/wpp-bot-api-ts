import { Employee } from '../entities/employee'

export abstract class EmployeeRepository {
	abstract save(employee: Employee): Promise<void>
	abstract find(id: string): Promise<Nullable<Employee>>
	abstract findOrThrow(id: string): Promise<Employee>
	abstract findByPhone(phone: string): Promise<Nullable<Employee>>
	abstract findAllByCompany(companyId: string): Promise<Employee[]>
}
