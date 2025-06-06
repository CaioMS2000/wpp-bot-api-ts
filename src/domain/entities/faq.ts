import { Entity } from '@/core/entities/entity'

export type FAQItem = {
    question: string
    answer: string
}

export type FAQCategory = {
    name: string
    items: FAQItem[]
}

export type FAQProps = {
    categories: FAQCategory[]
}

export class FAQ extends Entity<FAQProps> {
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
            this.props.categories.find(cat => cat.name.includes(partialName)) ||
            null
        )
    }

    get categories() {
        return this.props.categories
    }
}
