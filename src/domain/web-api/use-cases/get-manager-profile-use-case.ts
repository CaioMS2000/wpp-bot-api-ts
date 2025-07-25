import { ManagerRepository } from '@/domain/repositories/manager-repository'

export class GetManagerProfileUseCase {
	constructor(private readonly managerRepository: ManagerRepository) {}

	async execute(managerId: string) {
		const manager = await this.managerRepository.find(managerId)

		if (!manager) {
			throw new Error('Manager not found')
		}

		return {
			name: manager.name,
			email: manager.email,
			phone: manager.phone,
		}
	}
}
