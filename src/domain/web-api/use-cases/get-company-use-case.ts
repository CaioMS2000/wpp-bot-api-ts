import { CompanyRepository } from '@/domain/repositories/company-repository'
import { BusinessHoursType } from '../@types'

export class GetCompanyUseCase {
	constructor(private companyRepository: CompanyRepository) {}

	async execute(companyId: string) {
		const company = await this.companyRepository.findOrThrow(companyId)

		return company
	}
}
