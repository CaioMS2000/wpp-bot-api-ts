import { Client } from '../entities/client'

export abstract class ClientRepository {
    abstract save(client: Client): Promise<void>
    abstract findByPhone(phone: string): Promise<Nullable<Client>>
}
