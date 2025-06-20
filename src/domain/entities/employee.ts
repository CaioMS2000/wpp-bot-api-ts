import { Entity } from '@/core/entities/entity'
import { Company } from './company'
import { Department } from './department'

export type EmployeeProps = {
    name: string
    phone: string
    company: Company
    department: Nullable<Department>
}

export type CreateEmployeeInput = RequireOnly<
    EmployeeProps,
    'phone' | 'company' | 'name'
>

export class Employee extends Entity<EmployeeProps> {
    static create(props: CreateEmployeeInput, id?: string) {
        const defaults: Omit<EmployeeProps, 'phone' | 'company' | 'name'> = {
            department: null,
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

    get department() {
        return this.props.department
    }

    get company() {
        return this.props.company
    }

    set department(department: Nullable<Department>) {
        this.props.department = department
    }
}
