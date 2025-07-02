import { Client } from '../entities/client'
import { Company } from '../entities/company'
import { Department } from '../entities/department'

export abstract class DepartmentRepository {
    abstract save(department: Department): Promise<void>
    abstract find(company: Company, id: string): Promise<Nullable<Department>>
    abstract findByName(
        company: Company,
        name: string
    ): Promise<Nullable<Department>>
    abstract findByNameOrThrow(
        company: Company,
        name: string
    ): Promise<Department>
    abstract findAllActive(company: Company): Promise<Department[]>
    abstract insertClientIntoQueue(
        department: Department,
        client: Client
    ): Promise<void>
    abstract removeClientFromQueue(
        department: Department,
        client: Client
    ): Promise<void>
}
