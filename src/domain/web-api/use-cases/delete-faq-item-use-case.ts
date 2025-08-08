import { FAQRepository } from '@/domain/repositories/faq-repository'

export class DeleteFAQItemUseCase {
	constructor(private readonly faqRepository: FAQRepository) {}

	async execute(companyId: string, categoryId: string, itemId: string) {
		await this.faqRepository.deleteFAQItem(companyId, categoryId, itemId)
	}
}
