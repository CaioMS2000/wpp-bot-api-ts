import { Company } from '../entities/company'
import { FAQCategory, FAQItem } from '../entities/faq'

export abstract class FAQRepository {
    abstract save(
        company: Company,
        category: string,
        question: string,
        answer: string
    ): Promise<void>
    abstract findCategories(company: Company): Promise<FAQCategory[]>
    abstract findItemsByCategory(
        company: Company,
        categoryName: string
    ): Promise<FAQItem[]>
}
