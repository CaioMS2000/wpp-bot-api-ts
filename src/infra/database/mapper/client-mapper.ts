import { Client } from '@/domain/entities/client'

import {
    Client as PrismaClient,
    Company as PrismaCompany,
    Manager as PrismaManager,
} from 'ROOT/prisma/generated'
import { CompanyMapper } from './company-mapper'

export class ClientMapper {
    static toEntity(
        model: PrismaClient,
        companyModel: PrismaCompany,
        managerModel: PrismaManager
    ): Client {
        return Client.create(
            {
                company: CompanyMapper.toEntity({
                    ...companyModel,
                    manager: managerModel,
                }),
                phone: model.phone,
                name: model.name,
            },
            model.id
        )
    }

    static toModel(client: Client): PrismaClient {
        return {
            id: client.id,
            phone: client.phone,
            name: client.name,
            companyId: client.company.id,
        }
    }
}
