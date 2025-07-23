import { Company } from '../entities/company'
import { FAQCategory } from '../entities/faq-category'
import { FAQItem } from '../entities/faq-item'

export abstract class FAQRepository {
	abstract save(
		companyId: string,
		category: string,
		question: string,
		answer: string
	): Promise<void>
	abstract findCategories(companyId: string): Promise<FAQCategory[]>
	abstract findCategoryByNameOrThrow(
		companyId: string,
		name: string
	): Promise<FAQCategory>
	abstract findItemsByCategoryName(
		companyId: string,
		categoryName: string
	): Promise<FAQItem[]>
	abstract findItemsByCategory(
		companyId: string,
		categoryId: string
	): Promise<FAQItem[]>
}
