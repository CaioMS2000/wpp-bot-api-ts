import { logger } from '@/logger'
import { Manager } from '@/entities/manager'
import { hash, compare } from 'bcryptjs'
import { CompanyService } from '@/modules/whats-app/services/company-service'
import { ManagerService } from './manager-service'
import { ConflictError } from '../error/conflict'

export class AuthService {
	constructor(
		private companyService: CompanyService,
		private managerService: ManagerService
	) {}

	async authenticateWithPassword(email: string, password: string) {
		const manager = await this.managerService.getByEmail(email, {
			notNull: true,
		})
		const isPasswordValid = await compare(password, manager.password)

		if (!isPasswordValid) {
			throw new Error('Invalid password')
		}

		const company = await this.companyService.getCompanyByManagerId(manager.id)

		return {
			name: manager.name,
			email: manager.email,
			phone: manager.phone,
			managedCompanyCNPJ: company ? company.cnpj : null,
			id: manager.id,
		}
	}

	async registerManager(
		name: string,
		email: string,
		password: string,
		phone: Nullable<string> = null
	) {
		const existingManager = await this.managerService.getByEmail(email)

		if (existingManager) {
			throw new ConflictError('Manager already exists')
		}

		const hashedPassword = await hash(password, 6)

		await this.managerService.create({
			name,
			email,
			password: hashedPassword,
			phone,
		})

		return {
			name,
			email,
			phone,
		}
	}

	async getManagerMembership(companyCNPJ: string, managerId: string) {
		try {
			const manager = await this.managerService.getManager(managerId, {
				notNull: true,
			})
			const company = await this.companyService.getCompanyByCNPJ(companyCNPJ, {
				notNull: true,
			})

			if (manager.companyId !== company.id) {
				throw new Error('Could not resolve manager membership')
			}

			return {
				manager,
				company,
			}
		} catch (error) {
			logger.error(error)
			throw error
		}
	}
}
