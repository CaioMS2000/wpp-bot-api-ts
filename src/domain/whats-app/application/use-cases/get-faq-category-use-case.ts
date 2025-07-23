import { logger } from '@/core/logger'
import { FAQRepository } from '@/domain/repositories/faq-repository'

export class GetFAQCategoryUseCase {
	constructor(private faqRepository: FAQRepository) {}

	async execute(companyId: string, categoryId: string) {
		const categories = await this.faqRepository.findCategories(companyId)
		const category = categories.find(category => category.id === categoryId)

		logger.debug('[GetFAQCategoryUseCase.execute]\n', {
			companyId,
			categoryId,
			categories,
			category,
		})

		if (!category) {
			throw new Error('Category not found')
		}

		return category
	}
}
