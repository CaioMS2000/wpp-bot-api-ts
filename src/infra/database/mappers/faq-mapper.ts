import {
    FAQCategory as PrismaFAQCategory,
    FAQItem as PrismaFAQItem,
} from 'ROOT/prisma/generated'
import { FAQ, FAQCategory } from '@/domain/entities/faq'

type FAQCategoryWithRelations = PrismaFAQCategory & {
    items: PrismaFAQItem[]
}

export class FAQMapper {
    static toEntity(categories: FAQCategoryWithRelations[]): FAQ {
        const faqCategories: FAQCategory[] = categories.map(cat => ({
            name: cat.name,
            items: cat.items.map(item => ({
                question: item.question,
                answer: item.answer,
            })),
        }))

        return FAQ.create({
            categories: faqCategories,
        })
    }

    static categoriesToModel(
        entity: FAQ,
        companyId: string
    ): Array<{
        category: Omit<PrismaFAQCategory, 'id'>
        items: Omit<PrismaFAQItem, 'id' | 'categoryId'>[]
    }> {
        return entity.categories.map(cat => ({
            category: {
                name: cat.name,
                companyId,
            },
            items: cat.items.map(item => ({
                question: item.question,
                answer: item.answer,
            })),
        }))
    }
}
