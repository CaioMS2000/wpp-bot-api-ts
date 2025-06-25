import { BusinessHours, Company, WeekDay } from '@/domain/entities/company'
import {
    BusinessHour as PrismaBusinessHour,
    Company as PrismaCompany,
    Manager as PrismaManager,
} from 'ROOT/prisma/generated'
import { ManagerMapper } from './manager-mapper'

export class CompanyMapper {
    static toEntity(
        model: PrismaCompany & {
            manager: PrismaManager
            businessHours?: PrismaBusinessHour[]
        }
    ): Company {
        const entity = Company.create(
            {
                cnpj: model.cnpj,
                name: model.name,
                phone: model.phone,
                email: model.email,
                website: model.website,
                description: model.description,
                businessHours: model.businessHours?.reduce(
                    (acc, bh) => {
                        acc[bh.day] = {
                            openTime: bh.openTime as `${number}:${number}`,
                            closeTime: bh.closeTime as `${number}:${number}`,
                            isActive: bh.isActive,
                        }
                        return acc
                    },
                    {} as Partial<Record<WeekDay, Omit<BusinessHours, 'day'>>>
                ),
                manager: ManagerMapper.toEntity(model.manager),
            },
            model.id
        )

        return entity
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

    static businessHoursToModels(company: Company) {
        return company.businessHours.map(hour => ({
            day: hour.day,
            openTime: hour.openTime,
            closeTime: hour.closeTime,
            isActive: hour.isActive,
            companyId: company.id,
        }))
    }
}
