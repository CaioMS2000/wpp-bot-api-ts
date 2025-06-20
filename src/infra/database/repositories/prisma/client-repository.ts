import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { ClientRepository } from '@/domain/repositories/client-repository'
import { prisma } from '@/lib/prisma'

export class PrismaClientRepository extends ClientRepository {
    async save(client: Client): Promise<void> {
        await prisma.client.upsert({
            where: {
                id: client.id,
            },
            update: {
                name: client.name,
                phone: client.phone,
                companyId: client.company.id,
            },
            create: {
                id: client.id,
                name: client.name,
                phone: client.phone,
                companyId: client.company.id,
            },
        })
    }

    async findByPhone(
        company: Company,
        phone: string
    ): Promise<Nullable<Client>> {
        const model = await prisma.client.findFirst({
            where: {
                phone,
                companyId: company.id,
            },
        })

        if (!model) {
            return null
        }

        return Client.create(
            {
                phone: model.phone,
                name: model.name,
                company: company,
            },
            model.id
        )
    }
}
