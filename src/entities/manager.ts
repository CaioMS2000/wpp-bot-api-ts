import { Entity } from '@/entities/entity'

export type ManagerProps = {
	name: string
	email: string
	password: string
	phone: Nullable<string>
	companyId: Nullable<string>
}

export type CreateManagerInput = RequireOnly<
	ManagerProps,
	'name' | 'email' | 'password'
>

export class Manager extends Entity<ManagerProps> {
	static create(props: CreateManagerInput, id?: string) {
		const defaults: Omit<ManagerProps, 'name' | 'email' | 'password'> = {
			phone: null,
			companyId: null,
		}
		const manager = new Manager({ ...defaults, ...props }, id)
		return manager
	}

	get name() {
		return this.props.name
	}

	get email() {
		return this.props.email
	}

	get password() {
		return this.props.password
	}

	get phone() {
		return this.props.phone
	}

	get companyId() {
		return this.props.companyId
	}

	set companyId(companyId: Nullable<string>) {
		this.props.companyId = companyId
	}
}
