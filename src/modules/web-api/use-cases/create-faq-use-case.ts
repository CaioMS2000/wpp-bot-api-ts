import { FAQService } from '@/modules/whats-app/services/faq-service'

export class CreateFAQUseCase {
	constructor(private readonly faqService: FAQService) {}

	async execute(
		companyId: string,
		category: string,
		question: string,
		answer: string
	) {
		await this.faqService.create(companyId, category, question, answer)
		const items = await this.faqService.getItemsByCategoryName(
			companyId,
			category
		)
		const newFAQItem = items.find(
			i => i.question === question && i.answer === answer
		)

		if (!newFAQItem) {
			throw new Error('There should be at least the FAQ I just created.')
		}

		return {
			itemId: newFAQItem.id,
			categoryId: newFAQItem.id,
			categoryName: category,
			question: newFAQItem.question,
			answer: newFAQItem.answer,
		}
	}
}
