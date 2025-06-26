import { logger } from '@/core/logger'
import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { ClientRepository } from '@/domain/repositories/client-repository'

export class FindOrCreateClientUseCase {
    constructor(private clientRepository: ClientRepository) {}

    async execute(company: Company, phone: string) {
        let client = await this.clientRepository.findByPhone(company, phone)

        if (!client) {
            client = Client.create({
                phone,
                company,
            })
            await this.clientRepository.save(client)
        }

        return client
    }
}
