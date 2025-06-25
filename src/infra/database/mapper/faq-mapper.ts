import { FAQ, FAQCategory } from '@/domain/entities/faq'
import {
    FAQCategory as PrismaFAQCategory,
    FAQItem as PrismaFAQItem,
} from 'ROOT/prisma/generated'

export class FAQMapper {
    static toEntity(
        categories: (PrismaFAQCategory & { items: PrismaFAQItem[] })[]
    ): FAQ {
        const domainCategories: FAQCategory[] = categories.map(cat => ({
            name: cat.name,
            items: cat.items.map(item => ({
                question: item.question,
                answer: item.answer,
            })),
        }))

        return FAQ.create({ categories: domainCategories })
    }

    static toModel(
        categoryName: string,
        question: string,
        answer: string
    ): Pick<PrismaFAQItem, 'question' | 'answer'> & { categoryName: string } {
        return {
            categoryName,
            question,
            answer,
        }
    }
}
