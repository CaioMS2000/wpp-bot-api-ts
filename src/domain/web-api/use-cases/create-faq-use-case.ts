import { FAQRepository } from '@/domain/repositories/faq-repository'

export class CreateFAQUseCase {
	constructor(private readonly faqRepository: FAQRepository) {}

	async execute(
		companyId: string,
		category: string,
		question: string,
		answer: string
	) {
		await this.faqRepository.create(companyId, category, question, answer)
		const items = await this.faqRepository.findItemsByCategoryName(
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
