import { logger } from '@/core/logger'
import { Client } from '@/domain/entities/client'
import { ClientRepository } from '@/domain/repositories/client-repository'

export class FindOrCreateClientUseCase {
    constructor(private clientRepository: ClientRepository) {}

    async execute(phone: string) {
        logger.debug(`Looking for client with phone: ${phone}`)
        let client = await this.clientRepository.findByPhone(phone)

        if (!client) {
            logger.info(`Creating new client for phone: ${phone}`)
            client = Client.create({
                phone,
            })
            await this.clientRepository.save(client)
        }

        return client
    }
}
