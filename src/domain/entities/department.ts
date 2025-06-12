import { Entity } from '@/core/entities/entity'
import type { Employee } from './employee'
import type { Client } from './client'

export type DepartmentProps = {
    name: string
    queue: Client[]
    employee: Employee[]
}

export class Department extends Entity<DepartmentProps> {
    static create(props: DepartmentProps, id?: string) {
        const department = new Department(props, id)
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
}
