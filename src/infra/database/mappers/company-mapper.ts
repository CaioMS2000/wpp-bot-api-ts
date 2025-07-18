import {
    Company as PrismaCompany,
    BusinessHour as PrismaBusinessHour,
} from 'ROOT/prisma/generated'
import { Company, WeekDay, BusinessHours } from '@/domain/entities/company'

type CompanyWithRelations = PrismaCompany & {
    businessHours: PrismaBusinessHour[]
    // manager: PrismaManager
}

export class CompanyMapper {
    static toEntity(raw: CompanyWithRelations): Company {
        const businessHours: BusinessHours[] = raw.businessHours.map(bh => ({
            day: bh.day.toLowerCase() as WeekDay,
            openTime: bh.openTime as `${number}:${number}`,
            closeTime: bh.closeTime as `${number}:${number}`,
            isActive: bh.isActive,
        }))

        const entity = Company.create(
            {
                cnpj: raw.cnpj,
                name: raw.name,
                phone: raw.phone,
                email: raw.email,
                website: raw.website,
                description: raw.description,
                managerId: raw.managerId,
                businessHours: businessHours.reduce((acc, bh) => {
                    acc[bh.day] = {
                        openTime: bh.openTime,
                        closeTime: bh.closeTime,
                        isActive: bh.isActive,
                    }
                    return acc
                }, {} as any),
            },
            raw.id
        )

        entity.manager.company = entity

        return entity
    }

    static toModel(entity: Company): Omit<PrismaCompany, 'id'> {
        return {
            cnpj: entity.cnpj,
            name: entity.name,
            email: entity.email,
            phone: entity.phone,
            website: entity.website,
            description: entity.description,
            managerId: entity.manager.id,
        }
    }

    static businessHoursToModel(
        entity: Company
    ): Omit<PrismaBusinessHour, 'id'>[] {
        return entity.businessHours.map(bh => ({
            day: bh.day,
            openTime: bh.openTime,
            closeTime: bh.closeTime,
            isActive: bh.isActive,
            companyId: entity.id,
        }))
    }
}
