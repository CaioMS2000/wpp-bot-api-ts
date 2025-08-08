import { FAQRepository } from '@/domain/repositories/faq-repository'

export class UpdateFAQItemUseCase {
	constructor(private readonly faqRepository: FAQRepository) {}

	async execute(
		companyId: string,
		categoryId: string,
		itemId: string,
		category: string,
		question: string,
		answer: string
	) {
		const items = await this.faqRepository.findItemsByCategory(
			companyId,
			categoryId
		)
		const item = items.find(i => i.id === itemId)

		if (!item) {
			throw new Error('FAQ not found')
		}

		await this.faqRepository.updateFAQItem(
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
