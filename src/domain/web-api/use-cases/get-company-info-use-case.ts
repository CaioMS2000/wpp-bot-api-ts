import { CompanyRepository } from '@/domain/repositories/company-repository'
import { BusinessHoursType, CompanyType } from '../@types'

export class GetCompanyInfoUseCase {
	constructor(private companyRepository: CompanyRepository) {}

	async execute(companyId: string) {
		const company = await this.companyRepository.findOrThrow(companyId)
		const businessHours: BusinessHoursType = []

		company.businessHours.getDays().forEach(day => {
			const parsedDay = {
				open: day.openTime,
				close: day.closeTime,
				dayOfWeek: day.weekDay,
			}

			businessHours.push(parsedDay)
		})

		return {
			name: company.name,
			phone: company.phone,
			email: company.email,
			website: company.website,
			description: company.description,
			cnpj: company.cnpj,
			managerId: company.managerId,
			businessHours,
		} satisfies CompanyType
	}
}
