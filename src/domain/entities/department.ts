import { AggregateRoot } from '@/core/entities/aggregate-root'
import type { Client } from './client'
import { Employee } from './employee'

export type DepartmentProps = {
	name: string
	description: string
	companyId: string
	queue: Client['id'][]
}

export class Department extends AggregateRoot<DepartmentProps> {
	static create(
		props: RequireOnly<DepartmentProps, 'name' | 'companyId'>,
		id?: string
	) {
		const defaults: Omit<DepartmentProps, 'name' | 'companyId'> = {
			queue: [],
			description: '',
		}
		const department = new Department({ ...defaults, ...props }, id)
		return department
	}

	get name() {
		return this.props.name
	}

	get queue() {
		return this.props.queue
	}

	get description() {
		return this.props.description
	}

	get companyId() {
		return this.props.companyId
	}

	set queue(value: Client['id'][]) {
		this.props.queue = value
	}
}
