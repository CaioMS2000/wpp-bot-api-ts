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
		const existing = await this.usersRepository.findRegistredAdmin(phone, email)
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
			role: 'ADMIN',
		})
		const user: User = {
			email: newUser.email,
			id: newUser.id,
			name: newUser.name,
			phone: newUser.phone,
			passwordHash: newUser.passwordHash,
			tenantId: newUser.tenantId,
			role: 'ADMIN',
		}

		return user
	}

	async loginWithPassword(email: string, password: string): Promise<User> {
		const existingUser = await this.usersRepository.getAdminByEmail(email)

		if (!existingUser)
			throw AppError.authInvalidCredentials('Email ou senha inválidos.')

		const ok = await bcrypt.compare(password, existingUser.passwordHash)

		if (!ok) throw AppError.authInvalidCredentials('Email ou senha inválidos.')

		return existingUser
	}

	async updateAdminProfile(
		userId: string,
		data: { name?: string; phone?: string; email?: string }
	): Promise<User> {
		const patch: { name?: string; phone?: string; email?: string } = {}
		if (data.name !== undefined) patch.name = data.name
		if (data.phone !== undefined) patch.phone = data.phone
		if (data.email !== undefined) patch.email = data.email
		const updated = await this.usersRepository.updateAdminById(userId, patch)
		return updated
	}

	async getAdminMembership(cnpj: string, userId: string) {
		const tenant = await this.prismaTenantRepository.getByCNPJ(cnpj)

		if (!tenant) throw AppError.notFound('NOT_FOUND', 'Tenant não encontrado.')

		const tenantAdmin = await this.usersRepository.getAdmin(tenant.id, userId)

		if (!tenantAdmin)
			throw AppError.forbidden('Você não é administrador desse tenant.')

		return { tenant, admin: tenantAdmin }
	}

	async getPlatformAdmin(userId: string): Promise<User> {
		const user = await this.usersRepository.getAdminById(userId)
		if (!user)
			throw AppError.forbidden('Usuário não encontrado ou sem permissão.')
		// Platform admin: ADMIN with no tenant (tenantId null)
		if (user.tenantId !== null) {
			throw AppError.forbidden(
				'Acesso permitido apenas ao administrador da plataforma.'
			)
		}
		// Hard constraints: fixed email and password must equal 'admin@admin.com'
		if (user.email !== 'admin@admin.com') {
			throw AppError.forbidden(
				'Acesso restrito ao administrador da plataforma.'
			)
		}
		const ok = await bcrypt.compare('admin@admin.com', user.passwordHash)
		if (!ok) {
			throw AppError.forbidden(
				'Acesso restrito ao administrador da plataforma.'
			)
		}
		return user
	}
}
