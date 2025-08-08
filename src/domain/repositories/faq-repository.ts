import { FAQCategory } from '../entities/faq-category'
import { FAQItem } from '../entities/faq-item'

export abstract class FAQRepository {
	abstract create(
		companyId: string,
		category: string,
		question: string,
		answer: string
	): Promise<void>
	abstract updateFAQItem(
		companyId: string,
		categoryId: string,
		itemId: string,
		question: string,
		answer: string
	): Promise<void>
	abstract updateCategoryName(
		companyId: string,
		categoryId: string,
		name: string
	): Promise<void>
	abstract deleteFAQItem(
		companyId: string,
		categoryId: string,
		itemId: string
	): Promise<void>
	abstract deleteCategory(companyId: string, categoryId: string): Promise<void>
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
