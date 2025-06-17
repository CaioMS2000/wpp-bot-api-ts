import { Company } from '@/domain/entities/company'
import { Manager } from '@/domain/entities/manager'
import { CompanyRepository } from '@/domain/repositories/company-repository'

export class InMemoryCompanyRepository extends CompanyRepository {
    private data: Record<string, Company> = {}

    constructor() {
        super()

        this.seedInMemoryData()
    }

    async save(company: Company): Promise<void> {
        this.data[company.phone] = company
    }

    async findByPhone(phone: string): Promise<Nullable<Company>> {
        const data = this.data[phone]

        if (data) {
            return data
        }

        return null
    }

    async findByCNPJ(cnpj: string): Promise<Nullable<Company>> {
        const company = Object.values(this.data).find(
            company => company.cnpj === cnpj
        )

        return company || null
    }

    private async seedInMemoryData() {
        const manager = Manager.create({
            name: 'Eugenio Garcia',
            email: 'manager@evolight.com',
        })
        await this.save(
            Company.create({
                name: 'Evolight',
                phone: '556236266103',
                cnpj: '99999999999999',
                manager,
            })
        )
    }
}
