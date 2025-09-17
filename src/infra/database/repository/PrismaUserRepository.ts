import { User } from '@/modules/web-api/@types/user'
import { UserRepository } from '@/repository/UserRepository'
import type { PrismaClient } from '@prisma/client'

export class PrismaUserRepository implements UserRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async create(user: Omit<User, 'id'>): Promise<User> {
		const model = await this.prisma.user.create({ data: user })

		const newUser: User = {
			email: model.email,
			id: model.id,
			name: model.name,
			phone: model.phone,
			passwordHash: model.passwordHash,
			tenantId: model.tenantId,
			role: 'ADMIN',
		}

		return newUser
	}

	async findRegistredAdmin(phone: string, email: string): Promise<User | null> {
		const model = await this.prisma.user.findFirst({
			where: { phone, email },
		})

		if (!model) {
			return null
		}

		const user: User = {
			email: model.email,
			id: model.id,
			name: model.name,
			phone: model.phone,
			passwordHash: model.passwordHash,
			tenantId: model.tenantId,
			role: 'ADMIN',
		}

		return user
	}

	async getAdmin(tenantId: string, managerId: string): Promise<User | null> {
		const model = await this.prisma.user.findFirst({
			where: { tenantId, id: managerId, role: 'ADMIN' },
		})

		if (!model) {
			return null
		}

		const user: User = {
			email: model.email,
			id: model.id,
			name: model.name,
			phone: model.phone,
			passwordHash: model.passwordHash,
			tenantId: model.tenantId,
			role: 'ADMIN',
		}

		return user
	}

	async getAdminByEmail(email: string): Promise<User | null> {
		const model = await this.prisma.user.findFirst({
			where: { email, role: 'ADMIN' },
		})

		if (!model) {
			return null
		}

		const user: User = {
			email: model.email,
			id: model.id,
			name: model.name,
			phone: model.phone,
			passwordHash: model.passwordHash,
			tenantId: model.tenantId,
			role: 'ADMIN',
		}

		return user
	}

	async getAdminById(id: string): Promise<User | null> {
		const model = await this.prisma.user.findFirst({
			where: { id, role: 'ADMIN' },
		})

		if (!model) {
			return null
		}

		const user: User = {
			email: model.email,
			id: model.id,
			name: model.name,
			phone: model.phone,
			passwordHash: model.passwordHash,
			tenantId: model.tenantId,
			role: 'ADMIN',
		}

		return user
	}

	async updateAdminById(
		id: string,
		data: { name?: string; phone?: string; email?: string }
	): Promise<User> {
		const model = await this.prisma.user.update({ where: { id }, data })
		const user: User = {
			email: model.email,
			id: model.id,
			name: model.name,
			phone: model.phone,
			passwordHash: model.passwordHash,
			tenantId: model.tenantId,
			role: 'ADMIN',
		}
		return user
	}

	async setTenant(userId: string, tenantId: string): Promise<void> {
		await this.prisma.user.update({ where: { id: userId }, data: { tenantId } })
	}
}
