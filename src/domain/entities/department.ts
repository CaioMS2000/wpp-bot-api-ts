import { Entity } from '@/core/entities/entity'
import type { Client } from './client'
import { Company } from './company'
import type { Employee } from './employee'

export type DepartmentProps = {
    name: string
    description: string
    company: Company
    queue: Client[]
    employee: Employee[]
}

export class Department extends Entity<DepartmentProps> {
    static create(
        props: RequireOnly<DepartmentProps, 'name' | 'company'>,
        id?: string
    ) {
        const defaults: Omit<DepartmentProps, 'name' | 'company'> = {
            queue: [],
            employee: [],
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

    get employee() {
        return this.props.employee
    }

    get company() {
        return this.props.company
    }

    get description() {
        return this.props.description
    }
}
