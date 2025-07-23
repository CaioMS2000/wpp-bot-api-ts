import { CompanyRepository } from '@/domain/repositories/company-repository'

export class GetCompanyUseCase {
	constructor(private companyRepository: CompanyRepository) {}

	async execute(companyId: string) {
		return this.companyRepository.findOrThrow(companyId)
	}
}
