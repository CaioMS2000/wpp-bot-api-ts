import { CompanyService } from '@/modules/whats-app/services/company-service'

export class GetCompanyUseCase {
	constructor(private companyService: CompanyService) {}

	async execute(companyId: string) {
		const company = await this.companyService.getCompany(companyId, {
			notNull: true,
		})

		return company
	}
}
