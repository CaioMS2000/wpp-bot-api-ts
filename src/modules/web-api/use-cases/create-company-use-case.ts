import { BusinessHours } from '@/value-objects/business-hours'
import { CompanyType } from '../@types'
import { parseBusinessHours } from '../utils/parse-business-hours'
import { CompanyService } from '@/modules/whats-app/services/company-service'

export class CreateCompanyUseCase {
	constructor(private readonly companyService: CompanyService) {}

	async execute(data: CompanyType) {
		const { businessHours } = data
		let businessHoursObj: BusinessHours | undefined

		if (businessHours) {
			businessHoursObj = parseBusinessHours(businessHours)
		}

		const props = {
			...data,
			businessHours: businessHoursObj,
		}

		await this.companyService.createCompany(props)
	}
}
