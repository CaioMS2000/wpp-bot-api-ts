import { Manager } from '@/domain/entities/manager'
import { ManagerRepository } from '@/domain/repositories/manager-repository'
import { prisma } from '@/lib/prisma'
import { ManagerMapper } from '../../mappers/manager-mapper'

export class PrismaManagerRepository extends ManagerRepository {
	async save(manager: Manager): Promise<void> {
		const data = ManagerMapper.toModel(manager)

		await prisma.manager.upsert({
			where: { id: manager.id },
			update: data,
			create: data,
		})
	}

	async find(id: string): Promise<Nullable<Manager>> {
		const raw = await prisma.manager.findUnique({
			where: { id },
		})

		if (!raw) return null

		return ManagerMapper.toEntity(raw)
	}

	async findOrThrow(id: string): Promise<Manager> {
		const manager = await this.find(id)

		if (!manager) throw new Error('Manager not found')

		return manager
	}

	async findByEmail(email: string): Promise<Nullable<Manager>> {
		const raw = await prisma.manager.findUnique({
			where: { email },
		})

		if (!raw) return null

		return ManagerMapper.toEntity(raw)
	}
}
