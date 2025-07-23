import { Client as PrismaClient } from 'ROOT/prisma/generated'
import { Client } from '@/domain/entities/client'

export class ClientMapper {
	static toEntity(raw: PrismaClient): Client {
		return Client.create(
			{
				phone: raw.phone,
				name: raw.name,
				companyId: raw.companyId,
			},
			raw.id
		)
	}

	static toModel(entity: Client): Omit<PrismaClient, 'id'> {
		return {
			name: entity.name,
			phone: entity.phone,
			companyId: entity.companyId,
		}
	}
}
