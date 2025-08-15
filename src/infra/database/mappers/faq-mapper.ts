import { CategoryType, FAQ } from '@/entities/faq'
import { FAQCategory } from '@/entities/faq-category'
import { FAQItem } from '@/entities/faq-item'
import {
	FAQCategory as PrismaFAQCategory,
	FAQItem as PrismaFAQItem,
} from '@prisma/client'

type FAQCategoryWithRelations = PrismaFAQCategory & {
	items: PrismaFAQItem[]
}

export class FAQMapper {
	static toEntity(categories: FAQCategoryWithRelations[]): FAQ {
		const faqCategories = categories.map(cat => {
			const items = cat.items.map(i =>
				FAQItem.create(
					{
						question: i.question,
						answer: i.answer,
						categoryId: i.categoryId,
					},
					i.id
				)
			)
			return {
				category: FAQCategory.create(
					{
						name: cat.name,
					},
					cat.id
				),
				items,
			}
		})

		return FAQ.create({
			categories: faqCategories,
			companyId: categories[0].companyId,
		})
	}

	static toModel(
		category: FAQCategory,
		items: FAQItem[],
		companyId: string
	): PrismaFAQCategory & {
		items: PrismaFAQItem[]
	} {
		const match = items.some(ix => ix.categoryId === category.id)

		if (!match) {
			throw new Error('Category items do not match')
		}

		return {
			id: category.id,
			name: category.name,
			companyId,
			items: items.map(i => ({
				id: i.id,
				question: i.question,
				answer: i.answer,
				categoryId: category.id,
			})),
		}
	}
}
