export type Employee = {
	name: string
	phone: string
	departmentName?: string | null
}

export type EmployeeFull = {
	id: string
	name: string
	phone: string
	departmentName?: string | null
}

export interface EmployeeRepository {
	findByPhone(tenantId: string, phone: string): Promise<Employee | null>

	// CRUD used by web API
	create(
		tenantId: string,
		name: string,
		phone: string,
		departmentName?: string | null
	): Promise<EmployeeFull>

	update(
		tenantId: string,
		id: string,
		data: { name?: string; phone?: string; departmentName?: string | null }
	): Promise<EmployeeFull>

	get(tenantId: string, id: string): Promise<EmployeeFull | null>
	list(tenantId: string): Promise<EmployeeFull[]>
	listByDepartment(
		tenantId: string,
		departmentId: string
	): Promise<EmployeeFull[]>
	remove(tenantId: string, id: string): Promise<void>
}
