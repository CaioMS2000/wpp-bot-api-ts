import { FAQRepository } from '@/domain/repositories/faq-repository'
import { FAQs } from '../@types'

export class GetFAQsUseCase {
	constructor(private faqRepository: FAQRepository) {}

	async getFAQs(companyId: string) {
		const categories = await this.faqRepository.findCategories(companyId)
		const faqs: FAQs = {}

		for (const category of categories) {
			faqs[category.name] = []
			const items = await this.faqRepository.findItemsByCategory(
				companyId,
				category.id
			)

			items.forEach(item => {
				faqs[category.name].push({
					question: item.question,
					answer: item.answer,
				})
			})
		}

		return faqs
	}
}
