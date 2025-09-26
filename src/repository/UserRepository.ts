import type { User } from '@/modules/web-api/@types/user'

export interface UserRepository {
	create(user: Omit<User, 'id'>): Promise<User>
	findRegistredManager(phone: string, email: string): Promise<User | null>
	getManager(tenantId: string, managerId: string): Promise<User | null>
	getManagerByEmail(email: string): Promise<User | null>
	getManagerById(id: string): Promise<User | null>
	getByEmail(email: string): Promise<User | null>
	getById(id: string): Promise<User | null>
	updateManagerById(
		id: string,
		data: { name?: string; phone?: string; email?: string }
	): Promise<User>
	setTenant(userId: string, tenantId: string): Promise<void>
}
