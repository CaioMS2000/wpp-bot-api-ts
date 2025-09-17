export type User = {
	id: string
	email: string
	name: string
	phone: string
	tenantId: string | null
	passwordHash: string
	role: 'ADMIN' | 'EMPLOYEE'
}
