import { FAQ, FAQCategory, FAQItem } from '../entities/faq'

export abstract class FAQRepository {
    abstract save(
        category: string,
        question: string,
        answer: string
    ): Promise<void>
    abstract findCategories(): Promise<FAQCategory[]>
    abstract findItemsByCategory(categoryName: string): Promise<FAQItem[]>
}
