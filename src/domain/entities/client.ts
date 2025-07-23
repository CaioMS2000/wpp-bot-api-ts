import { AggregateRoot } from '@/core/entities/aggregate-root'

export type ClientProps = {
	phone: string
	name: string
	companyId: string
}

export type CreateClientInput = RequireOnly<ClientProps, 'phone' | 'companyId'>

export class Client extends AggregateRoot<ClientProps> {
	public readonly __name__ = 'Client' as const

	static create(props: CreateClientInput, id?: string) {
		const defaults: Omit<ClientProps, 'phone' | 'companyId'> = {
			name: `Cliente-${props.phone}`,
		}
		const client = new Client(
			{
				...props,
				name: props.name ?? defaults.name,
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
}
