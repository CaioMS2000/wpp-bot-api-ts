import { AggregateRoot } from '@/core/entities/aggregate-root'
import { FAQCategory } from './faq-category'

export type FAQProps = {
	categories: FAQCategory[]
	companyId: string
}

export class FAQ extends AggregateRoot<FAQProps> {
	static create(props: FAQProps, id?: string) {
		const faq = new FAQ(props, id)
		return faq
	}

	getCategoryNames(): string[] {
		return [...new Set(this.props.categories.map(cat => cat.name))]
	}

	getCategoryByName(name: string): Nullable<FAQCategory> {
		return this.props.categories.find(cat => cat.name === name) || null
	}

	findCategoryByPartialName(partialName: string): Nullable<FAQCategory> {
		return (
			this.props.categories.find(cat => cat.name.includes(partialName)) || null
		)
	}

	get categories() {
		return this.props.categories
	}

	get companyId() {
		return this.props.companyId
	}
}
