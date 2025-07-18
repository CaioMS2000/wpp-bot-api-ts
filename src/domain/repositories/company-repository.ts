import { Company } from '../entities/company'

export abstract class CompanyRepository {
    abstract save(company: Company): Promise<void>
    abstract find(id: string): Promise<Nullable<Company>>
    abstract findOrThrow(id: string): Promise<Company>
    abstract findByPhone(phone: string): Promise<Nullable<Company>>
    abstract findByCNPJ(cnpj: string): Promise<Nullable<Company>>
    abstract findByManagerId(managerId: string): Promise<Nullable<Company>>
}
