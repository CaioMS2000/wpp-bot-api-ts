export type Customer = {
	tenantId: string
	phone: string
	name: string
	email?: string | null
	profession?: string | null
}

export interface CustomerRepository {
	upsert(
		tenantId: string,
		phone: string,
		name?: string | null,
		email?: string | null,
		profession?: string | null
	): Promise<Customer>

	/** Busca clientes por uma lista de telefones (retorna phone, name, email, profession). */
	findByPhones(
		tenantId: string,
		phones: string[]
	): Promise<
		Array<{
			phone: string
			name: string
			email: string | null
			profession: string | null
		}>
	>
}
