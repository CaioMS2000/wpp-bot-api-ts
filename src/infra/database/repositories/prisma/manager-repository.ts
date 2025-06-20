import { Manager } from '@/domain/entities/manager'
import { ManagerRepository } from '@/domain/repositories/manager-repository'
import { prisma } from '@/lib/prisma'
import { ManagerMapper } from '../../mapper/manager-mapper'

export class PrismaManagerRepository extends ManagerRepository {
    async save(manager: Manager): Promise<void> {
        await prisma.manager.upsert({
            where: { id: manager.id },
            update: {
                name: manager.name,
                email: manager.email,
                phone: manager.phone,
                password: manager.password,
            },
            create: {
                id: manager.id,
                name: manager.name,
                email: manager.email,
                phone: manager.phone,
                password: manager.password,
            },
        })
    }

    async findByEmail(email: string): Promise<Nullable<Manager>> {
        const model = await prisma.manager.findUnique({
            where: { email },
            include: {
                company: true,
            },
        })

        if (!model) return null

        return ManagerMapper.toEntity(model, model.company ?? null)
    }
}
