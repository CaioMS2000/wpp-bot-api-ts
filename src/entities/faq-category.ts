import { Entity } from '@/entities/entity'
import { FAQItem } from './faq-item'

export type FAQCategoryProps = {
	name: string
}
export class FAQCategory extends Entity<FAQCategoryProps> {
	static create(props: FAQCategoryProps, id?: string) {
		return new FAQCategory(props, id)
	}

	get name() {
		return this.props.name
	}
}
