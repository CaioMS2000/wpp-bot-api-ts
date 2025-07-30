import { logger } from '@/core/logger'
import { BusinessHours } from '@/core/value-objects/business-hours'
import { Company } from '@/domain/entities/company'
import { CompanyRepository } from '@/domain/repositories/company-repository'
import { CompanyType } from '../@types'
import { parseBusinessHours } from '../utils/parse-business-hours'

export class UpdateCompanyUseCase {
	constructor(private companyRepository: CompanyRepository) {}

	async execute(cnpj: string, data: Partial<CompanyType>) {
		logger.debug('Updating company', { cnpj, data })
		const company = await this.companyRepository.findByCNPJ(cnpj)
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

		await this.companyRepository.save(updatedCompany)

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
