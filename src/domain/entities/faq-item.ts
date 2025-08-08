import { Entity } from '@/core/entities/entity'

export type FAQItemProps = {
	question: string
	answer: string
	categoryId: string
}

export class FAQItem extends Entity<FAQItemProps> {
	static create(props: FAQItemProps, id?: string) {
		return new FAQItem(props, id)
	}

	get question() {
		return this.props.question
	}

	get answer() {
		return this.props.answer
	}

	get categoryId() {
		return this.props.categoryId
	}
}
