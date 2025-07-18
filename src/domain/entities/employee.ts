import { Entity } from '@/core/entities/entity'
import { Company } from './company'
import { Department } from './department'

export type EmployeeProps = {
    name: string
    phone: string
    companyId: string
    company: Company
    department: Nullable<Department>
}

export type CreateEmployeeInput = RequireOnly<
    EmployeeProps,
    'phone' | 'name' | 'companyId'
>

export class Employee extends Entity<EmployeeProps> {
    private static readonly TEMPORARY_COMPANY = Symbol(
        'TEMPORARY_COMPANY'
    ) as unknown as Company
    static create(props: CreateEmployeeInput, id?: string) {
        const defaults: Omit<EmployeeProps, 'phone' | 'name' | 'companyId'> = {
            department: null,
            company: Employee.TEMPORARY_COMPANY,
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
        if (
            this.props.company === Employee.TEMPORARY_COMPANY ||
            !this.props.company
        ) {
            throw new Error(
                "Company is not set. Use the setter to set the company or use 'companyId'."
            )
        }
        return this.props.company
    }

    set department(department: Nullable<Department>) {
        this.props.department = department
    }

    set company(company: Company) {
        this.props.company = company
    }
}
