import { FAQCategory } from '@/domain/entities/faq-category'
import { FAQItem } from '@/domain/entities/faq-item'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { prisma } from '@/lib/prisma'

export class PrismaFAQRepository extends FAQRepository {
	async create(
		companyId: string,
		category: string,
		question: string,
		answer: string
	): Promise<void> {
		const existingCategory = await prisma.fAQCategory.findFirst({
			where: {
				companyId,
				name: category,
			},
		})

		if (existingCategory) {
			await prisma.fAQItem.create({
				data: {
					question,
					answer,
					categoryId: existingCategory.id,
				},
			})
		} else {
			await prisma.fAQCategory.create({
				data: {
					name: category,
					companyId,
					items: {
						create: {
							question,
							answer,
						},
					},
				},
			})
		}
	}

	async findCategories(companyId: string): Promise<FAQCategory[]> {
		const categories = await prisma.fAQCategory.findMany({
			where: {
				companyId,
			},
			include: {
				items: true,
			},
		})

		return categories.map(cat =>
			FAQCategory.create(
				{
					name: cat.name,
					items: cat.items.map(i => i.id),
				},
				cat.id
			)
		)
	}

	async findItemsByCategoryName(
		companyId: string,
		categoryName: string
	): Promise<FAQItem[]> {
		const category = await prisma.fAQCategory.findFirst({
			where: {
				companyId,
				name: categoryName,
			},
			include: {
				items: true,
			},
		})

		if (!category) return []

		return category.items.map(item =>
			FAQItem.create(
				{
					answer: item.answer,
					question: item.question,
					categoryId: item.categoryId,
				},
				item.id
			)
		)
	}

	async findItemsByCategory(
		companyId: string,
		categoryId: string
	): Promise<FAQItem[]> {
		const category = await prisma.fAQCategory.findFirst({
			where: {
				companyId,
				id: categoryId,
			},
			include: {
				items: true,
			},
		})

		if (!category) return []

		return category.items.map(item =>
			FAQItem.create(
				{
					answer: item.answer,
					question: item.question,
					categoryId: item.categoryId,
				},
				item.id
			)
		)
	}

	async findCategoryByNameOrThrow(
		companyId: string,
		name: string
	): Promise<FAQCategory> {
		const category = await prisma.fAQCategory.findFirst({
			where: {
				companyId,
				name,
			},
			include: {
				items: true,
			},
		})

		if (!category) {
			throw new Error('Category not found')
		}

		return FAQCategory.create(
			{
				name: category.name,
				items: category.items.map(i => i.id),
			},
			category.id
		)
	}

	async updateFAQItem(
		companyId: string,
		categoryId: string,
		itemId: string,
		question: string,
		answer: string
	): Promise<void> {
		const category = await prisma.fAQCategory.findUniqueOrThrow({
			where: { id: categoryId, companyId },
		})

		await prisma.fAQItem.update({
			where: {
				id: itemId,
				categoryId: category.id,
			},
			data: {
				question,
				answer,
			},
		})
	}

	async updateCategoryName(
		companyId: string,
		categoryId: string,
		name: string
	): Promise<void> {
		await prisma.fAQCategory.update({
			where: {
				id: categoryId,
				companyId,
			},
			data: {
				name,
			},
		})
	}

	async deleteFAQItem(
		companyId: string,
		categoryId: string,
		itemId: string
	): Promise<void> {
		const category = await prisma.fAQCategory.findUniqueOrThrow({
			where: { id: categoryId, companyId },
		})

		await prisma.fAQItem.delete({
			where: {
				id: itemId,
				categoryId: category.id,
			},
		})
	}

	async deleteCategory(companyId: string, categoryId: string): Promise<void> {
		const category = await prisma.fAQCategory.findUniqueOrThrow({
			where: { id: categoryId, companyId },
		})

		await prisma.fAQItem.deleteMany({
			where: {
				categoryId: category.id,
			},
		})
		await prisma.fAQCategory.delete({
			where: {
				id: category.id,
			},
		})
	}
}
