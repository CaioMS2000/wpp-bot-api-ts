import {
    Company as PrismaCompany,
    Manager as PrismaManager,
} from 'ROOT/prisma/generated'
import { Company } from '@/domain/entities/company'
import { ManagerMapper } from './manager-mapper'

export class CompanyMapper {
    static toEntity(
        model: PrismaCompany & { manager: PrismaManager }
    ): Company {
        return Company.create(
            {
                cnpj: model.cnpj,
                name: model.name,
                phone: model.phone,
                email: model.email,
                website: model.website,
                description: model.description,
                // manager: raw.manager,
                manager: ManagerMapper.toEntity(model.manager),
            },
            model.id
        )
    }

    static toModel(company: Company): PrismaCompany {
        return {
            id: company.id,
            cnpj: company.cnpj,
            name: company.name,
            phone: company.phone,
            email: company.email,
            website: company.website,
            description: company.description,
            managerId: company.manager.id,
        }
    }
}
