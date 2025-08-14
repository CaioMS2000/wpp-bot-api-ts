import { Entity } from '@/entities/entity'

export type EmployeeProps = {
	name: string
	phone: string
	companyId: string
	departmentId: Nullable<string>
}

export type CreateEmployeeInput = RequireOnly<
	EmployeeProps,
	'phone' | 'name' | 'companyId'
>

export class Employee extends Entity<EmployeeProps> {
	public readonly __name__ = 'Employee' as const

	static create(props: CreateEmployeeInput, id?: string) {
		const defaults: Omit<EmployeeProps, 'phone' | 'name' | 'companyId'> = {
			departmentId: null,
		}
		const employee = new Employee({ ...defaults, ...props }, id)
		return employee
	}

	get name() {
		return this.props.name
	}

	get phone() {
		return this.props.phone
	}

	get departmentId() {
		return this.props.departmentId
	}

	get companyId() {
		return this.props.companyId
	}

	set departmentId(departmentId: Nullable<string>) {
		this.props.departmentId = departmentId
	}

	set name(value: string) {
		this.props.name = value
	}

	set phone(value: string) {
		this.props.phone = value
	}
}
