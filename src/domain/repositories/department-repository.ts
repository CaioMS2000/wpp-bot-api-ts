import { Client } from '../entities/client'
import { Company } from '../entities/company'
import { Department } from '../entities/department'

export abstract class DepartmentRepository {
	abstract save(department: Department): Promise<void>
	abstract find(companyId: string, id: string): Promise<Nullable<Department>>
	abstract findOrThrow(companyId: string, id: string): Promise<Department>
	abstract findByName(
		companyId: string,
		name: string
	): Promise<Nullable<Department>>
	abstract findByNameOrThrow(
		companyId: string,
		name: string
	): Promise<Department>
	abstract findAll(companyId: string): Promise<Department[]>
	abstract insertClientIntoQueue(
		department: Department,
		client: Client
	): Promise<void>
	abstract getClientPositionInQueue(
		department: Department,
		client: Client
	): Promise<Nullable<number>>
	abstract removeClientFromQueue(
		department: Department,
		client: Client
	): Promise<void>
	abstract getNextClientFromQueue(
		department: Department
	): Promise<Nullable<string>>
}
