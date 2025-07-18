import { Entity } from '@/core/entities/entity'
import { Company } from './company'

export type ClientProps = {
    phone: string
    name: string
    companyId: string
    company: Company
}

export type CreateClientInput = RequireOnly<ClientProps, 'phone' | 'companyId'>

export class Client extends Entity<ClientProps> {
    private static readonly TEMPORARY_COMPANY = Symbol(
        'TEMPORARY_COMPANY'
    ) as unknown as Company
    static create(props: CreateClientInput, id?: string) {
        const defaults: Omit<ClientProps, 'phone' | 'company' | 'companyId'> = {
            name: `Cliente-${props.phone}`,
        }
        const company = props.company ?? Client.TEMPORARY_COMPANY
        const client = new Client(
            {
                ...props,
                name: props.name ?? defaults.name,
                company,
            },
            id
        )
        return client
    }

    get phone() {
        return this.props.phone
    }

    get company() {
        if (
            this.props.company === Client.TEMPORARY_COMPANY ||
            !this.props.company
        ) {
            throw new Error(
                'Company não foi definida. Use o setter para definir a company.'
            )
        }
        return this.props.company
    }

    get name() {
        return this.props.name
    }

    set company(company: Company) {
        this.props.company = company
    }
}
