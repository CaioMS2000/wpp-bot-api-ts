import { logger } from '@/core/logger'
import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { ClientRepository } from '@/domain/repositories/client-repository'

export class FindOrCreateClientUseCase {
	constructor(private clientRepository: ClientRepository) {}

	async execute(companyId: string, phone: string, name?: string) {
		logger.debug(`Resolving client for phone ${phone}`)
		let client = await this.clientRepository.findByPhone(companyId, phone)

		if (!client) {
			client = Client.create({
				phone,
				companyId,
				name,
			})
			await this.clientRepository.save(client)
			logger.info(`Client created ${client.id}`)
		}

		logger.debug(`Returning client ${client.id}`)
		return client
	}
}
