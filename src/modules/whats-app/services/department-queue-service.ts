import { Client } from '@/entities/client'
import { Company } from '@/entities/company'
import { ClientMapper } from '@/infra/database/mappers/client-mapper'
import { prisma } from '@/lib/prisma'
import { ClientAlreadyInQueueError } from '../errors/client-already-in-queue'
import { InconsistencyError } from '../errors/inconsistency'
import { DepartmentService } from './department-service'
import { UserService } from './user-service'

export class DepartmentQueueService {
	constructor(
		private departmentService: DepartmentService,
		private userService: UserService
	) {}

	async insertClientInQueue(
		company: Company,
		departmentId: string,
		clientId: string
	) {
		const department = await this.departmentService.findDepartment(
			company.id,
			departmentId,
			{ notNull: true }
		)

		const client = await this.userService.getClient(company.id, clientId, {
			notNull: true,
		})
		const clientPosition = await this.getClientPositionInQueue(
			department.id,
			client.id
		)

		if (clientPosition !== null) {
			throw new ClientAlreadyInQueueError(
				`Client already in queue: ${clientId}`
			)
		}

		await prisma.departmentQueue.create({
			data: {
				departmentId: department.id,
				clientId: client.id,
			},
		})
	}

	async getNextClient(company: Company, departmentId: string) {
		const department = await this.departmentService.findDepartment(
			company.id,
			departmentId,
			{ notNull: true }
		)

		const queueInstances = await prisma.departmentQueue.findMany({
			where: {
				departmentId: department.id,
			},
			orderBy: { joinedAt: 'asc' },
		})

		if (queueInstances.length === 0) {
			return null
		}
		const { clientId } = queueInstances[0]
		const client = await this.userService.getClient(company.id, clientId, {
			notNull: true,
		})

		return client
	}

	/**
	 * @param departmentId The department ID
	 * @param clientId The client ID
	 * @returns `null` if the client is not in the queue,
	 *          or a number in the inclusive range [1, n] indicating their position.
	 */
	async getClientPositionInQueue(
		departmentId: string,
		clientId: string
	): Promise<Nullable<number>> {
		const queueInstances = await prisma.departmentQueue.findMany({
			where: { departmentId },
			orderBy: { joinedAt: 'asc' },
		})
		const index = queueInstances.findIndex(qi => qi.clientId === clientId)
		return index > -1 ? index + 1 : null
	}

	async getQueue(companyId: string, departmentId: string) {
		const queueInstances = await prisma.departmentQueue.findMany({
			where: { departmentId },
			orderBy: { joinedAt: 'asc' },
		})
		const clients = new Array<Client>()

		for (const qi of queueInstances) {
			const c = await prisma.client.findUniqueOrThrow({
				where: { companyId, id: qi.clientId },
			})

			clients.push(ClientMapper.toEntity(c))
		}

		return clients
	}

	async removeCLientFromQueue(clientId: string) {
		const models = await prisma.departmentQueue.findMany({
			where: {
				clientId,
				leftAt: null,
			},
		})

		if (models.length > 1) {
			throw new InconsistencyError(
				'Same client have more than one active position in department queue'
			)
		}

		if (models.length === 0) {
			throw new InconsistencyError(
				'Cant not remove a user that is not in queue'
			)
		}

		const model = models[0]

		await prisma.departmentQueue.delete({ where: { id: model.id } })
	}
}
