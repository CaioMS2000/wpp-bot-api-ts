import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { ClientRepository } from '@/domain/repositories/client-repository'
import { prisma } from '@/lib/prisma'
import { ClientMapper } from '../../mappers/client-mapper'

export class PrismaClientRepository extends ClientRepository {
	async save(client: Client): Promise<void> {
		const data = ClientMapper.toModel(client)

		await prisma.client.upsert({
			where: { id: client.id },
			update: data,
			create: {
				...data,
				id: client.id,
			},
		})
	}

	async findByPhone(
		companyId: string,
		phone: string
	): Promise<Nullable<Client>> {
		const raw = await prisma.client.findFirst({
			where: {
				phone,
				companyId,
			},
			include: {
				company: {
					include: {
						businessHours: true,
						manager: true,
					},
				},
			},
		})

		if (!raw) return null

		const client = ClientMapper.toEntity(raw)

		return client
	}

	async find(companyId: string, id: string): Promise<Nullable<Client>> {
		const raw = await prisma.client.findFirst({
			where: {
				id,
				companyId,
			},
			include: {
				company: {
					include: {
						businessHours: true,
						manager: true,
					},
				},
			},
		})

		if (!raw) {
			return null
		}

		const client = ClientMapper.toEntity(raw)

		return client
	}

	async findOrThrow(companyId: string, id: string): Promise<Client> {
		const entity = await this.find(companyId, id)

		if (!entity) {
			throw new Error(`Client with id ${id} not found in company ${companyId}`)
		}

		return entity
	}
}
