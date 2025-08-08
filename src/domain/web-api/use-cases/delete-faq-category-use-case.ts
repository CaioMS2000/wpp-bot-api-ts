import { FAQRepository } from '@/domain/repositories/faq-repository'

export class DeleteFAQCategoryUseCase {
	constructor(private readonly faqRepository: FAQRepository) {}

	async execute(companyId: string, categoryId: string) {
		await this.faqRepository.deleteCategory(companyId, categoryId)
	}
}
