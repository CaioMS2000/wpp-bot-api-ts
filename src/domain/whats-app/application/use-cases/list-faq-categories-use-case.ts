import { Company } from '@/domain/entities/company'
import { FAQRepository } from '@/domain/repositories/faq-repository'

export class ListFAQCategoriesUseCase {
	constructor(private faqRepository: FAQRepository) {}

	async execute(companyId: string) {
		const categories = await this.faqRepository.findCategories(companyId)

		return categories
	}
}
