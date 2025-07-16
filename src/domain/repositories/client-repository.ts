import { Client } from '../entities/client'
import { Company } from '../entities/company'

export abstract class ClientRepository {
    abstract save(client: Client): Promise<void>
    abstract find(company: Company, id: string): Promise<Nullable<Client>>
    abstract findOrThrow(company: Company, id: string): Promise<Client>
    abstract findByPhone(
        company: Company,
        phone: string
    ): Promise<Nullable<Client>>
}
