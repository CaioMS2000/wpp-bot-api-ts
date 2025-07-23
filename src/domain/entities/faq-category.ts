import { Entity } from '@/core/entities/entity'
import { FAQItem } from './faq-item'

export type FAQCategoryProps = {
	name: string
	items: FAQItem['id'][]
}
export class FAQCategory extends Entity<FAQCategoryProps> {
	static create(props: FAQCategoryProps, id?: string) {
		return new FAQCategory(props, id)
	}

	get items() {
		return this.props.items
	}

	get name() {
		return this.props.name
	}
}
