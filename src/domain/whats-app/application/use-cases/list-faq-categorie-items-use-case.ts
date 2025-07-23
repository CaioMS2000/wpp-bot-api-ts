import { Company } from '@/domain/entities/company'
import { FAQRepository } from '@/domain/repositories/faq-repository'

export class ListFAQCategorieItemsUseCase {
	constructor(private faqRepository: FAQRepository) {}

	async execute(companyId: string, categoryName: string) {
		const items = await this.faqRepository.findItemsByCategoryName(
			companyId,
			categoryName
		)

		return items
	}
}
