import { Entity } from '@/core/entities/entity'

export type ClientProps = {
    phone: string
    department: Nullable<string>
}

export class Client extends Entity<ClientProps> {
    static create(props: RequireOnly<ClientProps, 'phone'>, id?: string) {
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
