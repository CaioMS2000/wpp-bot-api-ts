import { FAQService } from '@/modules/whats-app/services/faq-service'
import { FAQs } from '../@types'

export class GetFAQsUseCase {
	constructor(private faqService: FAQService) {}

	async getFAQs(companyId: string) {
		const categories = await this.faqService.getAllCategories(companyId)
		const results = (await Promise.all(
			categories.map(async category => {
				const items = await this.faqService.getItems(companyId, category.id)
				return {
					id: category.id,
					name: category.name,
					items: items.map(item => ({
						id: item.id,
						question: item.question,
						answer: item.answer,
					})),
				}
			})
		)) satisfies FAQs

		return results
	}
}
