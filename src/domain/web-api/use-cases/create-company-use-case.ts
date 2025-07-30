import { BusinessHours } from '@/core/value-objects/business-hours'
import { Company } from '@/domain/entities/company'
import { CompanyRepository } from '@/domain/repositories/company-repository'
import { CompanyType } from '../@types'
import { parseBusinessHours } from '../utils/parse-business-hours'

export class CreateCompanyUseCase {
	constructor(private readonly companyRepository: CompanyRepository) {}

	async execute(data: CompanyType) {
		const { businessHours } = data
		let businessHoursObj: BusinessHours | undefined

		if (businessHours) {
			businessHoursObj = parseBusinessHours(businessHours)
		}

		const company = Company.create({
			...data,
			businessHours: businessHoursObj,
		})

		await this.companyRepository.save(company)

		return company
	}
}
