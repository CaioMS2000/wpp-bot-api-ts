import { Entity } from '@/core/entities/entity'
import { Company } from './company'

export type ManagerProps = {
    name: string
    email: string
    password: string
    phone: Nullable<string>
    company: Nullable<Company>
}

export type CreateManagerInput = RequireOnly<
    ManagerProps,
    'name' | 'email' | 'password'
>

export class Manager extends Entity<ManagerProps> {
    static create(props: CreateManagerInput, id?: string) {
        const defaults: Omit<ManagerProps, 'name' | 'email' | 'password'> = {
            phone: null,
            company: null,
        }
        const manager = new Manager({ ...defaults, ...props }, id)
        return manager
    }

    get name() {
        return this.props.name
    }

    get email() {
        return this.props.email
    }

    get password() {
        return this.props.password
    }

    get phone() {
        return this.props.phone
    }

    get company() {
        return this.props.company
    }

    set company(company: Nullable<Company>) {
        this.props.company = company
    }
}
