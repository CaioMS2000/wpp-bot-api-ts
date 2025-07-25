import {
	BusinessHours,
	Day,
	TimeString,
	WeekDay,
} from '@/core/value-objects/business-hours'
import { Company } from '@/domain/entities/company'
import { CompanyRepository } from '@/domain/repositories/company-repository'
import { z } from 'zod'
import { GetManagerProfileUseCase } from '../use-cases/get-manager-profile-use-case'
import { GetAllCompanyEmployeesUseCase } from '../use-cases/get-all-company-employees-use-case'

export const businessHoursSchema = z
	.array(
		z.object({
			dayOfWeek: z.enum([
				'Sunday',
				'Monday',
				'Tuesday',
				'Wednesday',
				'Thursday',
				'Friday',
				'Saturday',
			]),
			open: z
				.string()
				.regex(/^\d{1,2}:\d{1,2}$/)
				.transform(val => {
					const [h, m] = val.split(':')
					return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
				}),
			close: z
				.string()
				.regex(/^\d{1,2}:\d{1,2}$/)
				.transform(val => {
					const [h, m] = val.split(':')
					return `${h.padStart(2, '0')}:${m.padStart(2, '0')}`
				}),
		})
	)
	.length(7)
	.optional()

export class APIService {
	constructor(
		private getManagerProfileUseCase: GetManagerProfileUseCase,
		private getAllCompanyEmployeesUseCase: GetAllCompanyEmployeesUseCase
	) {}

	async createCompany(
		data: Omit<Parameters<typeof Company.create>[0], 'businessHours'> & {
			businessHours: z.infer<typeof businessHoursSchema>
		}
	) {
		const { businessHours } = data
		let businessHoursObj: BusinessHours | undefined

		if (businessHours) {
			businessHoursObj = new BusinessHours(
				businessHours.map(
					d =>
						new Day(
							d.dayOfWeek.toLowerCase() as WeekDay,
							d.open as TimeString,
							d.close as TimeString
						)
				)
			)
		}

		const company = Company.create({
			...data,
			businessHours: businessHoursObj,
		})

		return company
	}

	async getManagerProfile(managerId: string) {
		return this.getManagerProfileUseCase.execute(managerId)
	}

	async getAllCompanyEmployees(companyId: string) {
		return this.getAllCompanyEmployeesUseCase.execute(companyId)
	}
}
