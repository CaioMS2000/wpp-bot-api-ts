import {
    Client as PrismaClient,
    Company as PrismaCompany,
    Manager as PrismaManager,
    BusinessHour as PrismaBusinessHour,
} from 'ROOT/prisma/generated'
import { Client } from '@/domain/entities/client'
import { CompanyMapper } from './company-mapper'

type ClientWithRelations = PrismaClient & {
    company: PrismaCompany & {
        businessHours: PrismaBusinessHour[]
        manager: PrismaManager
    }
}

export class ClientMapper {
    static toEntity(raw: ClientWithRelations): Client {
        return Client.create(
            {
                phone: raw.phone,
                name: raw.name,
                company: CompanyMapper.toEntity(raw.company),
            },
            raw.id
        )
    }

    static toModel(entity: Client): Omit<PrismaClient, 'id'> {
        return {
            name: entity.name,
            phone: entity.phone,
            companyId: entity.company.id,
        }
    }
}
