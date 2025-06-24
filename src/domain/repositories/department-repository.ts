import { Client } from '../entities/client'
import { Company } from '../entities/company'
import { Department } from '../entities/department'

export abstract class DepartmentRepository {
    abstract save(department: Department): Promise<void>
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
