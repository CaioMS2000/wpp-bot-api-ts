import { Company } from '@/entities/company'
import { logger } from '@/logger'
import { BusinessHours } from '@/value-objects/business-hours'
import { CompanyType } from '../@types'
import { parseBusinessHours } from '../utils/parse-business-hours'
import { CompanyService } from '@/modules/whats-app/services/company-service'

export class UpdateCompanyUseCase {
	constructor(private companyService: CompanyService) {}

	async execute(cnpj: string, data: Partial<CompanyType>) {
		logger.debug('Updating company', { cnpj, data })
		const company = await this.companyService.getCompanyByCNPJ(cnpj)
		let businessHoursObj: BusinessHours | undefined

		if (data.businessHours) {
			businessHoursObj = parseBusinessHours(data.businessHours)
		}

		if (!company) {
			throw new Error('Company not found')
		}

		const updatedCompany = Company.create(
			{
				cnpj: data.cnpj ?? company.cnpj,
				name: data.name ?? company.name,
				email: data.email ?? company.email,
				phone: data.phone ?? company.phone,
				website: data.website ?? company.website,
				description: data.description ?? company.description,
				managerId: company.managerId,
				businessHours: businessHoursObj ?? company.businessHours,
			},
			company.id
		)

		await this.companyService.save(updatedCompany)

		return {
			cnpj: updatedCompany.cnpj,
			name: updatedCompany.name,
			email: updatedCompany.email,
			phone: updatedCompany.phone,
			website: updatedCompany.website,
			description: updatedCompany.description,
		}
	}
}
