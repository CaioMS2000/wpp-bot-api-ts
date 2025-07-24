import { Manager } from '@/domain/entities/manager'
import { CompanyRepository } from '@/domain/repositories/company-repository'
import { ManagerRepository } from '@/domain/repositories/manager-repository'
import { hash, compare } from 'bcryptjs'

export class AuthService {
	constructor(
		private companyRepository: CompanyRepository,
		private managerRepository: ManagerRepository
	) {}

	async authenticateWithPassword(email: string, password: string) {
		const manager = await this.managerRepository.findByEmail(email)

		if (!manager) {
			throw new Error('Manager not found')
		}

		const isPasswordValid = await compare(password, manager.password)

		if (!isPasswordValid) {
			throw new Error('Invalid password')
		}

		return {
			name: manager.name,
			email: manager.email,
			phone: manager.phone,
			id: manager.id,
		}
	}

	async registerManager(
		name: string,
		email: string,
		password: string,
		phone: Nullable<string>
	) {
		const existingManager = await this.managerRepository.findByEmail(email)

		if (existingManager) {
			throw new Error('Manager already exists')
		}

		const hashedPassword = await hash(password, 6)

		const manager = Manager.create({
			name,
			email,
			password: hashedPassword,
			phone,
		})

		await this.managerRepository.save(manager)

		return {
			name,
			email,
			phone,
		}
	}

	async getManagerMembership(companyCNPJ: string, managerId: string) {
		const manager = await this.managerRepository.findOrThrow(managerId)

		const company = await this.companyRepository.findByCNPJ(companyCNPJ)

		if (!company) {
			throw new Error('Company not found')
		}

		if (manager.companyId !== company.id) {
			throw new Error('Could not resolve manager membership')
		}

		return {
			manager,
			company,
		}
	}
}
