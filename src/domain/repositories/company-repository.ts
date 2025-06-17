import { Company } from '../entities/company'

export abstract class CompanyRepository {
    abstract save(company: Company): Promise<void>
    abstract findByPhone(phone: string): Promise<Nullable<Company>>
    abstract findByCNPJ(cnpj: string): Promise<Nullable<Company>>
}
