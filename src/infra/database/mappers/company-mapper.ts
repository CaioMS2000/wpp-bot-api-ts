import {
	BusinessHours,
	Day,
	TimeString,
	WeekDay,
} from '@/core/value-objects/business-hours'
import { Company } from '@/domain/entities/company'
import {
	BusinessHour as PrismaBusinessHour,
	Company as PrismaCompany,
} from 'ROOT/prisma/generated'

type CompanyWithRelations = PrismaCompany & {
	businessHours: PrismaBusinessHour[]
	// manager: PrismaManager
}

export class CompanyMapper {
	static toEntity(raw: CompanyWithRelations): Company {
		const days: Day[] = raw.businessHours.map(bh => {
			const weekDay: WeekDay = bh.day
			const openTime: TimeString = bh.openTime as `${number}:${number}`
			const closeTime: TimeString = bh.closeTime as `${number}:${number}`

			return new Day(weekDay, openTime, closeTime)
		})

		const entity = Company.create(
			{
				cnpj: raw.cnpj,
				name: raw.name,
				phone: raw.phone,
				email: raw.email,
				website: raw.website,
				description: raw.description,
				managerId: raw.managerId,
				businessHours: new BusinessHours(days),
			},
			raw.id
		)

		return entity
	}

	static toModel(entity: Company): PrismaCompany {
		return {
			id: entity.id,
			cnpj: entity.cnpj,
			name: entity.name,
			email: entity.email,
			phone: entity.phone,
			website: entity.website,
			description: entity.description,
			managerId: entity.managerId,
		}
	}

	static businessHoursToModel(
		entity: Company
	): Omit<PrismaBusinessHour, 'id'>[] {
		return entity.businessHours.getDays().map(bh => ({
			day: bh.weekDay,
			openTime: bh.openTime,
			closeTime: bh.closeTime,
			isActive: bh.isOpenAt(new Date()),
			companyId: entity.id,
		}))
	}
}
