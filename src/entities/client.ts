import { Entity } from '@/entities/entity'

export type ClientProps = {
	phone: string
	name: string
	companyId: string
	email: Nullable<string>
	profession: Nullable<string>
}

export type CreateClientInput = RequireOnly<ClientProps, 'phone' | 'companyId'>

export class Client extends Entity<ClientProps> {
	public readonly __name__ = 'Client' as const

	static create(props: CreateClientInput, id?: string) {
		const defaults: Omit<ClientProps, 'phone' | 'companyId'> = {
			name: `Cliente-${props.phone}`,
			email: null,
			profession: null,
		}
		const client = new Client(
			{
				...defaults,
				...props,
			},
			id
		)
		return client
	}

	get phone() {
		return this.props.phone
	}

	get name() {
		return this.props.name
	}

	get companyId() {
		return this.props.companyId
	}

	get email() {
		return this.props.email
	}

	get profession() {
		return this.props.profession
	}
}
