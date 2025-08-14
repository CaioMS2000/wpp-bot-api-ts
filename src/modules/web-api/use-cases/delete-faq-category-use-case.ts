import { FAQService } from '@/modules/whats-app/services/faq-service'

export class DeleteFAQCategoryUseCase {
	constructor(private readonly faqService: FAQService) {}

	async execute(companyId: string, categoryId: string) {
		await this.faqService.deleteCategory(companyId, categoryId)
	}
}
