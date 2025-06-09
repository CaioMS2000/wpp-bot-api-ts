import { FAQ, FAQCategory, FAQItem } from '@/domain/entities/faq'
import { FAQRepository } from '@/domain/repositories/faq-repositorie'
import { createSlug } from '@/utils/text'

export class InMemoryFAQRepository extends FAQRepository {
    private data: Record<string, FAQItem & { category: string }> = {}

    async save(
        category: string,
        question: string,
        answer: string
    ): Promise<void> {
        const categorySlug = createSlug(category)
        const questionSlug = createSlug(question)

        this.data[`${categorySlug}-${questionSlug}`] = {
            category,
            question,
            answer,
        }
    }

    async findCategories(): Promise<FAQCategory[]> {
        const categories: Record<string, FAQCategory> = {}

        Object.values(this.data).forEach(item => {
            const categorySlug = createSlug(item.category)
            if (!categories[categorySlug]) {
                categories[categorySlug] = {
                    name: item.category,
                    items: [],
                }
            }
            categories[categorySlug].items.push({
                question: item.question,
                answer: item.answer,
            })
        })

        return Object.values(categories)
    }

    async findItemsByCategory(categoryName: string): Promise<FAQItem[]> {
        const items: FAQItem[] = []

        Object.values(this.data).forEach(item => {
            if (item.category === categoryName) {
                items.push({
                    question: item.question,
                    answer: item.answer,
                })
            }
        })

        return items
    }
}
