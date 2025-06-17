import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { ClientRepository } from '@/domain/repositories/client-repository'

export class InMemoryClientRepository extends ClientRepository {
    private data: Record<string, Client> = {}

    async save(client: Client): Promise<void> {
        this.data[client.phone] = client
    }

    async findByPhone(
        company: Company,
        phone: string
    ): Promise<Nullable<Client>> {
        const data = this.data[phone]

        if (data && data.company.id === company.id) {
            return data
        }

        return null
    }
}
