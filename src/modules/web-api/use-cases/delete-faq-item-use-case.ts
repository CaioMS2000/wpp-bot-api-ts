import { FAQService } from '@/modules/whats-app/services/faq-service'

export class DeleteFAQItemUseCase {
	constructor(private readonly faqService: FAQService) {}

	async execute(companyId: string, categoryId: string, itemId: string) {
		await this.faqService.deleteFAQItem(companyId, categoryId, itemId)
	}
}
