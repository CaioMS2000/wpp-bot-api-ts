import { ClientRepository } from '@/domain/repositories/client-repository'

export class GetClientUseCase {
	constructor(private clientRepository: ClientRepository) {}

	async execute(companyId: string, clientId: string) {
		return this.clientRepository.findOrThrow(companyId, clientId)
	}
}
