import { logger } from '@/core/logger'
import { FAQItem } from '@/domain/entities/faq-item'
import { FAQRepository } from '@/domain/repositories/faq-repository'

export class GetFAQItemsUseCase {
	constructor(private faqRepository: FAQRepository) {}

	async execute(companyId: string, categoryId: string): Promise<FAQItem[]> {
		return await this.faqRepository.findItemsByCategory(companyId, categoryId)
	}
}
