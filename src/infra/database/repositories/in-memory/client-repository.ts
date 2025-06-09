import { Client } from '@/domain/entities/client'
import { ClientRepository } from '@/domain/repositories/client-repository'

export class InMemoryClientRepository extends ClientRepository {
    private data: Record<string, Client> = {}

    async save(client: Client): Promise<void> {
        this.data[client.phone] = client
    }

    async findByPhone(phone: string): Promise<Nullable<Client>> {
        return this.data[phone] ?? null
    }
}
