import { Entity } from '@/core/entities/entity'

export type EmployeeProps = {
    phone: string
    department: Nullable<string>
    event_history: any[]
}

export class Employee extends Entity<EmployeeProps> {
    static create(props: EmployeeProps, id?: string) {
        const employee = new Employee(props, id)
        return employee
    }

    get phone() {
        return this.props.phone
    }

    get department() {
        return this.props.department
    }

    get event_history() {
        return this.props.event_history
    }
}
