import { FAQRepository } from '@/domain/repositories/faq-repository'
import { FAQs } from '../@types'

export class GetFAQsUseCase {
	constructor(private faqRepository: FAQRepository) {}

	async getFAQs(companyId: string) {
		const categories = await this.faqRepository.findCategories(companyId)
		console.log('\ncategories:\n', categories)
		const results = (await Promise.all(
			categories.map(async category => {
				const items = await this.faqRepository.findItemsByCategory(
					companyId,
					category.id
				)
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
		console.log('\nresults:\n', results)

		return results
	}
}
