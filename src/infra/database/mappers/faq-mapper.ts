import {
	FAQCategory as PrismaFAQCategory,
	FAQItem as PrismaFAQItem,
} from 'ROOT/prisma/generated'
import { FAQ } from '@/domain/entities/faq'
import { FAQCategory } from '@/domain/entities/faq-category'
import { FAQItem } from '@/domain/entities/faq-item'

type FAQCategoryWithRelations = PrismaFAQCategory & {
	items: PrismaFAQItem[]
}

export class FAQMapper {
	static toEntity(categories: FAQCategoryWithRelations[]): FAQ {
		const faqCategories: FAQCategory[] = categories.map(cat => {
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
			return FAQCategory.create(
				{
					name: cat.name,
					items: items.map(i => i.id),
				},
				cat.id
			)
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
		const match = category.items.some(ix => items.some(iy => iy.id === ix))

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
