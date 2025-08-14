import { FAQService } from '@/modules/whats-app/services/faq-service'

export class UpdateFAQItemUseCase {
	constructor(private readonly faqService: FAQService) {}

	async execute(
		companyId: string,
		categoryId: string,
		itemId: string,
		category: string,
		question: string,
		answer: string
	) {
		const items = await this.faqService.getItems(companyId, categoryId)
		const item = items.find(i => i.id === itemId)

		if (!item) {
			throw new Error('FAQ not found')
		}

		await this.faqService.updateFAQItem(
			companyId,
			categoryId,
			item.id,
			question,
			answer
		)

		return {
			id: item.id,
			category: category,
			question: item.question,
			answer: item.answer,
		}
	}
}
