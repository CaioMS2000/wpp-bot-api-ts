import { BusinessHours, Day } from '@/core/value-objects/business-hours'
import type { Manager } from './manager'
import { AggregateRoot } from '@/core/entities/aggregate-root'

export type CompanyProps = {
	cnpj: string
	name: string
	email: Nullable<string>
	phone: string
	website: Nullable<string>
	description: Nullable<string>
	businessHours: BusinessHours
	managerId: string
	manager: Manager
}

export type CreateCompanyInput = {
	cnpj: string
	name: string
	phone: string
	managerId: string
	manager?: Nullable<Manager>
	email?: Nullable<string>
	website?: Nullable<string>
	description?: Nullable<string>
	businessHours?: BusinessHours
}

export class Company extends AggregateRoot<CompanyProps> {
	private static readonly TEMPORARY_MANAGER = Symbol(
		'TEMPORARY_MANAGER'
	) as unknown as Manager
	private static readonly DEFAULT_BUSINESS_HOURS: BusinessHours =
		new BusinessHours([
			new Day('monday', '08:00', '18:00'),
			new Day('tuesday', '08:00', '18:00'),
			new Day('wednesday', '08:00', '18:00'),
			new Day('thursday', '08:00', '18:00'),
			new Day('friday', '08:00', '18:00'),
			new Day('saturday', '00:00', '00:00'),
			new Day('sunday', '00:00', '00:00'),
		])

	static create(props: CreateCompanyInput, id?: string) {
		const company = new Company(
			{
				cnpj: props.cnpj,
				name: props.name,
				email: props.email ?? null,
				phone: props.phone,
				website: props.website ?? null,
				description: props.description ?? null,
				businessHours: props.businessHours ?? Company.DEFAULT_BUSINESS_HOURS,
				managerId: props.managerId,
				manager: props.manager ?? Company.TEMPORARY_MANAGER,
			},
			id
		)

		return company
	}

	get cnpj() {
		return this.props.cnpj
	}

	get name() {
		return this.props.name
	}

	get email() {
		return this.props.email
	}

	get phone() {
		return this.props.phone
	}

	get website() {
		return this.props.website
	}

	get description() {
		return this.props.description
	}

	get businessHours() {
		return this.props.businessHours
	}

	get managerId() {
		return this.props.managerId
	}

	get manager() {
		if (
			this.props.manager === Company.TEMPORARY_MANAGER ||
			!this.props.manager
		) {
			throw new Error(
				"Manager is not set. Use the setter to set the manager or use 'managerId'."
			)
		}
		return this.props.manager
	}

	set manager(manager: Manager) {
		this.props.manager = manager
	}
}
