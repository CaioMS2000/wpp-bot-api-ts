import { ManagerService } from '../services/manager-service'

export class GetManagerProfileUseCase {
	constructor(private readonly managerService: ManagerService) {}

	async execute(managerId: string) {
		const manager = await this.managerService.getManager(managerId, {
			notNull: true,
		})

		return {
			name: manager.name,
			email: manager.email,
			phone: manager.phone,
		}
	}
}
