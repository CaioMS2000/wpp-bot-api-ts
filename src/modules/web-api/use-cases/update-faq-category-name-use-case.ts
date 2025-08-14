import { FAQService } from '@/modules/whats-app/services/faq-service'

export class UpdateFAQCategoryNameUseCase {
	constructor(private readonly faqService: FAQService) {}

	async execute(companyId: string, categoryId: string, name: string) {
		await this.faqService.updateCategoryName(companyId, categoryId, name)
	}
}
