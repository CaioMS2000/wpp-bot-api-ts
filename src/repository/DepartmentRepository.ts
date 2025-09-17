export type QueueEntry = {
	customerPhone: string
	createdAt: Date
}

export interface DepartmentRepository {
	listDepartments(tenantId: string): Promise<string[]>
	enqueueCustomer(
		tenantId: string,
		departmentName: string,
		customerPhone: string
	): Promise<void>
	listQueue(tenantId: string, departmentName: string): Promise<QueueEntry[]>
	dequeueNext(
		tenantId: string,
		departmentName: string
	): Promise<QueueEntry | null>
	/** Returns the department the customer is queued in, if any */
	findCustomerQueueDepartment(
		tenantId: string,
		customerPhone: string
	): Promise<string | null>
	/** Removes the customer from a department queue */
	leaveQueue(
		tenantId: string,
		departmentName: string,
		customerPhone: string
	): Promise<void>

	// CRUD for departments
	create(
		tenantId: string,
		name: string,
		description?: string | null
	): Promise<{ id: string; name: string; description: string | null }>
	update(
		tenantId: string,
		id: string,
		data: { name?: string; description?: string | null }
	): Promise<{ id: string; name: string; description: string | null }>
	get(
		tenantId: string,
		id: string
	): Promise<{ id: string; name: string; description: string | null } | null>
	list(
		tenantId: string
	): Promise<{ id: string; name: string; description: string | null }[]>
	remove(tenantId: string, id: string): Promise<void>

	// Optional assignment of employee to department
	assignEmployee(
		tenantId: string,
		departmentId: string,
		employeeId: string | null
	): Promise<void>

	/** Replace all employees of a department with the provided list (ids).
	 * - Adds missing employees (moves from other departments if needed)
	 * - Removes employees currently in the department but not present in the list
	 * - If list is empty, removes all
	 */
	replaceEmployees(
		tenantId: string,
		departmentId: string,
		employeeIds: string[]
	): Promise<void>
}
