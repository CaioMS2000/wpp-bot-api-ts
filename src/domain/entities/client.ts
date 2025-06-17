import { Entity } from '@/core/entities/entity'

export type ClientProps = {
    phone: string
    department: Nullable<string>
}

export type CreateClientInput = RequireOnly<ClientProps, 'phone'>

export class Client extends Entity<ClientProps> {
    static create(props: CreateClientInput, id?: string) {
        const defaults: Omit<ClientProps, 'phone'> = {
            department: null,
        }
        const client = new Client({ ...defaults, ...props }, id)
        return client
    }

    get phone() {
        return this.props.phone
    }

    get department() {
        return this.props.department
    }
}
