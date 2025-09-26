import { AppError } from '@/infra/http/errors'
import type { TenantRepository } from '@/repository/TenantRepository'
import type { UserRepository } from '@/repository/UserRepository'
import bcrypt from 'bcryptjs'
import { User } from '../@types/user'

export class AuthService {
	constructor(
		private usersRepository: UserRepository,
		private readonly prismaTenantRepository: TenantRepository
	) {}

	async signup(
		email: string,
		password: string,
		name: string,
		phone: string
	): Promise<User> {
		const existing = await this.usersRepository.findRegistredManager(
			phone,
			email
		)
		if (existing)
			throw AppError.conflict(
				'EMAIL_ALREADY_REGISTERED',
				'Email já cadastrado.'
			)
		const passwordHash = await bcrypt.hash(password, 10)
		const newUser = await this.usersRepository.create({
			email,
			name,
			phone,
			passwordHash,
			tenantId: null,
			role: 'MANAGER',
		})
		const user: User = {
			email: newUser.email,
			id: newUser.id,
			name: newUser.name,
			phone: newUser.phone,
			passwordHash: newUser.passwordHash,
			tenantId: newUser.tenantId,
			role: 'MANAGER',
		}

		return user
	}

	async loginWithPassword(email: string, password: string): Promise<User> {
		const existingUser = await this.usersRepository.getByEmail(email)

		if (!existingUser)
			throw AppError.authInvalidCredentials('Email ou senha inválidos.')

		const ok = await bcrypt.compare(password, existingUser.passwordHash)

		if (!ok) throw AppError.authInvalidCredentials('Email ou senha inválidos.')

		return existingUser
	}

	async updateManagerProfile(
		userId: string,
		data: { name?: string; phone?: string; email?: string }
	): Promise<User> {
		const patch: { name?: string; phone?: string; email?: string } = {}
		if (data.name !== undefined) patch.name = data.name
		if (data.phone !== undefined) patch.phone = data.phone
		if (data.email !== undefined) patch.email = data.email
		const updated = await this.usersRepository.updateManagerById(userId, patch)
		return updated
	}

	async getManagerMembership(cnpj: string, userId: string) {
		const tenant = await this.prismaTenantRepository.getByCNPJ(cnpj)

		if (!tenant) throw AppError.notFound('NOT_FOUND', 'Tenant não encontrado.')

		const tenantManager = await this.usersRepository.getManager(
			tenant.id,
			userId
		)

		if (!tenantManager)
			throw AppError.forbidden('Você não é administrador desse tenant.')

		return { tenant, manager: tenantManager }
	}

	async getPlatformAdmin(userId: string): Promise<User> {
		const user = await this.usersRepository.getById(userId)
		if (!user)
			throw AppError.forbidden('Usuário não encontrado ou sem permissão.')
		if (user.role !== 'SYSTEM_ADMIN')
			throw AppError.forbidden(
				'Acesso restrito ao administrador da plataforma.'
			)
		return user
	}
}
