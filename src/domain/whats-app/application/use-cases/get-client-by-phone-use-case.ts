import { ClientRepository } from '@/domain/repositories/client-repository'

export class GetClientByPhoneUseCase {
	constructor(private clientRepository: ClientRepository) {}

	async execute(companyId: string, clientPhone: string) {
		const client = await this.clientRepository.findByPhone(
			companyId,
			clientPhone
		)

		if (!client) {
			throw new Error('Client not found')
		}

		return client
	}
}
