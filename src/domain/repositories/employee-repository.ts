import { Employee } from '../entities/employee'

export abstract class EmployeeRepository {
	abstract save(employee: Employee): Promise<void>
	abstract find(companyId: string, id: string): Promise<Nullable<Employee>>
	abstract findOrThrow(companyId: string, id: string): Promise<Employee>
	abstract findByPhone(
		companyId: string,
		phone: string
	): Promise<Nullable<Employee>>
	abstract findAllByCompany(companyId: string): Promise<Employee[]>
	abstract findAllByDepartment(
		companyId: string,
		departmentId: string
	): Promise<Employee[]>
}
