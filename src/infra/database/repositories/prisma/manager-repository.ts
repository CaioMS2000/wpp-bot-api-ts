import { prisma } from '@/lib/prisma'
import { Manager } from '@/domain/entities/manager'
import { ManagerRepository } from '@/domain/repositories/manager-repository'
import { ManagerMapper } from '../../mappers/manager-mapper'

export class PrismaManagerRepository extends ManagerRepository {
    async save(manager: Manager): Promise<void> {
        const data = ManagerMapper.toModel(manager)

        await prisma.manager.upsert({
            where: { id: manager.id },
            update: data,
            create: {
                ...data,
                id: manager.id,
            },
        })
    }

    async findByEmail(email: string): Promise<Nullable<Manager>> {
        const raw = await prisma.manager.findUnique({
            where: { email },
        })

        if (!raw) return null

        return ManagerMapper.toEntity(raw)
    }
}
