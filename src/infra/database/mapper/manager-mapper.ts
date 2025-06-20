import { Company } from '@/domain/entities/company'
import { Manager } from '@/domain/entities/manager'
import {
    Manager as PrismaManager,
    Company as PrismaCompany,
} from 'ROOT/prisma/generated'

export class ManagerMapper {
    static toEntity(
        model: PrismaManager,
        companyModel: Nullable<PrismaCompany> = null
    ): Manager {
        const entity = Manager.create(
            {
                name: model.name,
                email: model.email,
                password: model.password,
                phone: model.phone,
            },
            model.id
        )
        const company = ManagerMapper.companyModelToEntity(companyModel, entity)

        entity.company = company

        return entity
    }

    static toModel(manager: Manager): PrismaManager {
        return {
            id: manager.id,
            name: manager.name,
            phone: manager.phone,
            email: manager.email,
            password: manager.password,
        }
    }

    private static companyModelToEntity(
        companyModel: Nullable<PrismaCompany>,
        manager: Manager
    ): Nullable<Company> {
        if (!companyModel) {
            return null
        }

        return Company.create(
            {
                name: companyModel.name,
                cnpj: companyModel.cnpj,
                phone: companyModel.phone,
                email: companyModel.email,
                website: companyModel.website,
                description: companyModel.description,
                manager: manager,
            },
            companyModel.id
        )
    }
}
