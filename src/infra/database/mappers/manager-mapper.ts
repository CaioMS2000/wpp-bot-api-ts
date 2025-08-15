import { Manager } from '@/entities/manager'
import { Manager as PrismaManager } from '@prisma/client'

export class ManagerMapper {
	static toEntity(raw: PrismaManager): Manager {
		return Manager.create(
			{
				name: raw.name,
				email: raw.email,
				password: raw.password,
				phone: raw.phone,
				companyId: raw.companyId,
			},
			raw.id
		)
	}

	static toModel(entity: Manager): PrismaManager {
		return {
			id: entity.id,
			name: entity.name,
			email: entity.email,
			password: entity.password,
			phone: entity.phone,
			companyId: entity.companyId,
		}
	}
}
