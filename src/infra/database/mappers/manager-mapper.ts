import { Manager as PrismaManager } from 'ROOT/prisma/generated'
import { Manager } from '@/domain/entities/manager'

export class ManagerMapper {
	static toEntity(raw: PrismaManager): Manager {
		return Manager.create(
			{
				name: raw.name,
				email: raw.email,
				password: raw.password,
				phone: raw.phone,
			},
			raw.id
		)
	}

	static toModel(entity: Manager): Omit<PrismaManager, 'id'> {
		return {
			name: entity.name,
			email: entity.email,
			password: entity.password,
			phone: entity.phone,
		}
	}
}
