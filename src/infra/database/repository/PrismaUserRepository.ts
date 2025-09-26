import { User } from '@/modules/web-api/@types/user'
import { UserRepository } from '@/repository/UserRepository'
import { type PrismaClient, UserRole } from '@prisma/client'

export class PrismaUserRepository implements UserRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async create(user: Omit<User, 'id'>): Promise<User> {
		const model = await this.prisma.user.create({
			data: {
				email: user.email,
				name: user.name,
				phone: user.phone,
				passwordHash: user.passwordHash,
				tenantId: user.tenantId,
				role: user.role as UserRole,
			},
		})

		const newUser: User = {
			email: model.email,
			id: model.id,
			name: model.name,
			phone: model.phone,
			passwordHash: model.passwordHash,
			tenantId: model.tenantId,
			role: model.role as User['role'],
		}

		return newUser
	}

	async findRegistredManager(
		phone: string,
		email: string
	): Promise<User | null> {
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
			role: model.role as User['role'],
		}

		return user
	}

	async getManager(tenantId: string, managerId: string): Promise<User | null> {
		const model = await this.prisma.user.findFirst({
			where: { tenantId, id: managerId, role: 'MANAGER' },
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
			role: model.role as User['role'],
		}

		return user
	}

	async getManagerByEmail(email: string): Promise<User | null> {
		const model = await this.prisma.user.findFirst({
			where: { email, role: 'MANAGER' },
		})
		if (!model) return null
		const user: User = {
			email: model.email,
			id: model.id,
			name: model.name,
			phone: model.phone,
			passwordHash: model.passwordHash,
			tenantId: model.tenantId,
			role: model.role as User['role'],
		}
		return user
	}

	async getManagerById(id: string): Promise<User | null> {
		const model = await this.prisma.user.findFirst({
			where: { id, role: 'MANAGER' },
		})
		if (!model) return null
		const user: User = {
			email: model.email,
			id: model.id,
			name: model.name,
			phone: model.phone,
			passwordHash: model.passwordHash,
			tenantId: model.tenantId,
			role: model.role as User['role'],
		}
		return user
	}

	async getByEmail(email: string): Promise<User | null> {
		const model = await this.prisma.user.findFirst({ where: { email } })
		if (!model) return null
		const user: User = {
			email: model.email,
			id: model.id,
			name: model.name,
			phone: model.phone,
			passwordHash: model.passwordHash,
			tenantId: model.tenantId,
			role: model.role as User['role'],
		}
		return user
	}

	async getById(id: string): Promise<User | null> {
		const model = await this.prisma.user.findFirst({ where: { id } })
		if (!model) return null
		const user: User = {
			email: model.email,
			id: model.id,
			name: model.name,
			phone: model.phone,
			passwordHash: model.passwordHash,
			tenantId: model.tenantId,
			role: model.role as User['role'],
		}
		return user
	}

	async updateManagerById(
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
			role: model.role as User['role'],
		}
		return user
	}

	async setTenant(userId: string, tenantId: string): Promise<void> {
		await this.prisma.user.update({ where: { id: userId }, data: { tenantId } })
	}
}
