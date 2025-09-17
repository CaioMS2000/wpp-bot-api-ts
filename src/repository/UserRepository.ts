import type { User } from '@/modules/web-api/@types/user'

export interface UserRepository {
	create(user: Omit<User, 'id'>): Promise<User>
	findRegistredAdmin(phone: string, email: string): Promise<User | null>
	getAdmin(tenantId: string, managerId: string): Promise<User | null>
	getAdminByEmail(email: string): Promise<User | null>
	getAdminById(id: string): Promise<User | null>
	updateAdminById(
		id: string,
		data: { name?: string; phone?: string; email?: string }
	): Promise<User>
	setTenant(userId: string, tenantId: string): Promise<void>
}
