import { Entity } from '@/core/entities/entity'
import { Company } from './company'

export type EmployeeProps = {
    phone: string
    company: Company
    department: Nullable<string>
}

export type CreateEmployeeInput = RequireOnly<
    EmployeeProps,
    'phone' | 'company'
>

export class Employee extends Entity<EmployeeProps> {
    static create(props: CreateEmployeeInput, id?: string) {
        const defaults: Omit<EmployeeProps, 'phone' | 'company'> = {
            department: null,
        }
        const employee = new Employee({ ...defaults, ...props }, id)
        return employee
    }

    get phone() {
        return this.props.phone
    }

    get department() {
        return this.props.department
    }

    get company() {
        return this.props.company
    }
}
