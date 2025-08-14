import { Entity } from '@/entities/entity'
import { FAQCategory } from './faq-category'
import { FAQItem } from './faq-item'

export type CategoryType = { category: FAQCategory; items: FAQItem[] }
export type FAQProps = {
	categories: CategoryType[]
	companyId: string
}

export class FAQ extends Entity<FAQProps> {
	static create(props: FAQProps, id?: string) {
		const faq = new FAQ(props, id)
		return faq
	}

	getCategoryNames(): string[] {
		return [...new Set(this.props.categories.map(cat => cat.category.name))]
	}

	getCategoryByName(name: string): Nullable<FAQCategory> {
		return (
			this.props.categories.find(cat => cat.category.name === name)?.category ??
			null
		)
	}

	findCategoryByPartialName(partialName: string): Nullable<FAQCategory> {
		return (
			this.props.categories.find(cat => cat.category.name.includes(partialName))
				?.category ?? null
		)
	}

	get categories() {
		return this.props.categories
	}

	get companyId() {
		return this.props.companyId
	}
}
