import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { ClientRepository } from '@/domain/repositories/client-repository'
import { prisma } from '@/lib/prisma'
import { ClientMapper } from '../../mappers/client-mapper'
import { CompanyMapper } from '../../mappers/company-mapper'

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
        company: Company,
        phone: string
    ): Promise<Nullable<Client>> {
        const raw = await prisma.client.findFirst({
            where: {
                phone,
                companyId: company.id,
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

        return ClientMapper.toEntity(raw)
    }

    async find(company: Company, id: string): Promise<Nullable<Client>> {
        const raw = await prisma.client.findFirst({
            where: {
                id,
                companyId: company.id,
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

        return ClientMapper.toEntity(raw)
    }

    async findOrThrow(company: Company, id: string): Promise<Client> {
        const entity = await this.find(company, id)

        if (!entity) {
            throw new Error(
                `Client with id ${id} not found in company ${company.id}`
            )
        }

        return entity
    }
}
