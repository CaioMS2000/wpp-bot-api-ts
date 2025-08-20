import { Entity } from '@/entities/entity'
import type { Client } from './client'

export type DepartmentProps = {
	name: string
	description: string
	companyId: string
}

export type CreateDepartmentInput = RequireOnly<
	DepartmentProps,
	'name' | 'companyId'
>

export class Department extends Entity<DepartmentProps> {
	static create(props: CreateDepartmentInput, id?: string) {
		const defaults: Omit<DepartmentProps, 'name' | 'companyId'> = {
			description: '',
		}
		const department = new Department({ ...defaults, ...props }, id)
		return department
	}

	get name() {
		return this.props.name
	}

	get description() {
		return this.props.description
	}

	get companyId() {
		return this.props.companyId
	}
}
