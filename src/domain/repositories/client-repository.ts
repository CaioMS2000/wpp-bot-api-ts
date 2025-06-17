import { Client } from '../entities/client'
import { Company } from '../entities/company'

export abstract class ClientRepository {
    abstract save(client: Client): Promise<void>
    abstract findByPhone(
        company: Company,
        phone: string
    ): Promise<Nullable<Client>>
}
