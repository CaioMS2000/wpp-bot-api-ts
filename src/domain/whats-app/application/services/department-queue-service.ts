import { Company } from '@/domain/entities/company'
import { ClientRepository } from '@/domain/repositories/client-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'

export class DepartmentQueueService {
	constructor(
		private departmentRepository: DepartmentRepository,
		private clientRepository: ClientRepository
	) {}

	async insertClientInQueue(
		company: Company,
		departmentId: string,
		clientId: string
	) {
		const department = await this.departmentRepository.find(
			company.id,
			departmentId
		)

		if (!department) {
			throw new Error(`Department not found: ${departmentId}`)
		}

		const client = await this.clientRepository.findOrThrow(company.id, clientId)
		const clientPosition =
			await this.departmentRepository.getClientPositionInQueue(
				department,
				client
			)

		if (clientPosition !== null) {
			throw new Error(`Client already in queue: ${clientId}`)
		}

		await this.departmentRepository.insertClientIntoQueue(department, client)
	}

	async getNextClient(company: Company, departmentId: string) {
		const department = await this.departmentRepository.find(
			company.id,
			departmentId
		)

		if (!department) {
			throw new Error(`Department not found: ${departmentId}`)
		}

		const clientId =
			await this.departmentRepository.getNextClientFromQueue(department)

		if (!clientId) {
			return null
		}

		const client = await this.clientRepository.findOrThrow(company.id, clientId)

		return client
	}
}
