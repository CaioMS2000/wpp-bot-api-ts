import { Client } from '../entities/client'

export abstract class ClientRepository {
	abstract save(client: Client): Promise<void>
	abstract find(companyId: string, id: string): Promise<Nullable<Client>>
	abstract findOrThrow(companyId: string, id: string): Promise<Client>
	abstract findByPhone(
		companyId: string,
		phone: string
	): Promise<Nullable<Client>>
}
