import { Entity } from '@/core/entities/entity'
import { Company } from './company'

export type ClientProps = {
    phone: string
    company: Company
}

export type CreateClientInput = RequireOnly<ClientProps, 'phone' | 'company'>

export class Client extends Entity<ClientProps> {
    static create(props: CreateClientInput, id?: string) {
        const defaults: Omit<ClientProps, 'phone' | 'company'> = {}
        const client = new Client({ ...defaults, ...props }, id)
        return client
    }

    get phone() {
        return this.props.phone
    }

    get company() {
        return this.props.company
    }
}
