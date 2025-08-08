import { FAQRepository } from '@/domain/repositories/faq-repository'

export class UpdateFAQCategoryNameUseCase {
	constructor(private readonly faqRepository: FAQRepository) {}

	async execute(companyId: string, categoryId: string, name: string) {
		await this.faqRepository.updateCategoryName(companyId, categoryId, name)
	}
}
