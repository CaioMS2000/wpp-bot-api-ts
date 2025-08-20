import { NotNullConfig, NotNullParams } from '@/@types/not-null-params'
import { FAQCategory } from '@/entities/faq-category'
import { FAQItem } from '@/entities/faq-item'
import { ResourceNotFoundError } from '@/errors/errors/resource-not-found-error'
import { prisma } from '@/lib/prisma'

export class FAQService {
	// constructor() {}

	async create(
		companyId: string,
		category: string,
		question: string,
		answer: string
	) {
		let faqCategory = await prisma.fAQCategory.findFirst({
			where: { companyId, name: category },
		})
		if (!faqCategory) {
			faqCategory = await prisma.fAQCategory.create({
				data: {
					name: category,
					companyId,
				},
			})
		}

		await prisma.fAQItem.create({
			data: {
				question,
				answer,
				categoryId: faqCategory.id,
			},
		})
	}

	async getAllCategories(companyId: string) {
		const categoryModels = await prisma.fAQCategory.findMany({
			where: { companyId },
		})

		return categoryModels.map(cm =>
			FAQCategory.create(
				{
					name: cm.name,
				},
				cm.id
			)
		)
	}

	async getCategory(companyId: string, categoryId: string) {
		const categoryModel = await prisma.fAQCategory.findUniqueOrThrow({
			where: { companyId, id: categoryId },
		})

		return FAQCategory.create(
			{
				name: categoryModel.name,
			},
			categoryModel.id
		)
	}

	async getItems(companyId: string, categoryId: string) {
		const categoryModel = await prisma.fAQCategory.findUniqueOrThrow({
			where: { companyId, id: categoryId },
		})
		const itemsModels = await prisma.fAQItem.findMany({
			where: {
				categoryId: categoryModel.id,
			},
		})

		return itemsModels.map<FAQItem>(im =>
			FAQItem.create(
				{
					question: im.question,
					answer: im.answer,
					categoryId,
				},
				im.id
			)
		)
	}

	async getCategoryByName(
		companyId: string,
		name: string
	): Promise<Nullable<FAQCategory>>
	async getCategoryByName(
		companyId: string,
		name: string,
		config: NotNullConfig
	): Promise<FAQCategory>
	async getCategoryByName(
		companyId: string,
		name: string,
		config?: NotNullParams
	) {
		const model = await prisma.fAQCategory.findFirst({
			where: { companyId, name },
		})

		if (!model) {
			if (config && config.notNull === true) {
				throw new ResourceNotFoundError('FAQCategory not found')
			}

			return null
		}

		return FAQCategory.create({ name: model.name }, model.id)
	}

	async getItemsByCategoryName(
		companyId: string,
		categoryName: string
	): Promise<FAQItem[]> {
		const category = await this.getCategoryByName(companyId, categoryName, {
			notNull: true,
		})
		const models = await prisma.fAQItem.findMany({
			where: { categoryId: category.id },
		})

		return models.map(m => {
			const item = FAQItem.create(
				{
					question: m.question,
					answer: m.answer,
					categoryId: m.categoryId,
				},
				m.id
			)

			return item
		})
	}

	async deleteCategory(companyId: string, categoryId: string): Promise<void> {
		const category = await prisma.fAQCategory.findFirstOrThrow({
			where: { companyId, id: categoryId },
		})
		const items = await prisma.fAQItem.findMany({
			where: { categoryId: category.id },
		})

		await prisma.$transaction(async prismaT => {
			await Promise.all(
				items.map(async i => prismaT.fAQItem.delete({ where: { id: i.id } }))
			)
			await prismaT.fAQCategory.delete({ where: { id: category.id } })
		})
	}

	async deleteFAQItem(
		companyId: string,
		categoryId: string,
		itemId: string
	): Promise<void> {
		const category = await prisma.fAQCategory.findFirstOrThrow({
			where: { companyId, id: categoryId },
		})

		await prisma.fAQItem.delete({
			where: { categoryId: category.id, id: itemId },
		})
	}

	async updateFAQItem(
		companyId: string,
		categoryId: string,
		itemId: string,
		question: string,
		answer: string
	): Promise<void> {
		await prisma.$transaction(async prismaT => {
			await prismaT.fAQCategory.findFirst({
				where: { id: categoryId, companyId },
			}) // just to force an error if does not exists
			await prismaT.fAQItem.update({
				where: { id: itemId, categoryId },
				data: {
					question,
					answer,
				},
			})
		})
	}

	async updateCategoryName(
		companyId: string,
		categoryId: string,
		name: string
	): Promise<void> {
		await prisma.fAQCategory.update({
			where: { id: categoryId, companyId },
			data: { name },
		})
	}
}

abstract class FAQRepository {
	abstract create(
		companyId: string,
		category: string,
		question: string,
		answer: string
	): Promise<void>
	abstract updateFAQItem(
		companyId: string,
		categoryId: string,
		itemId: string,
		question: string,
		answer: string
	): Promise<void>
	abstract updateCategoryName(
		companyId: string,
		categoryId: string,
		name: string
	): Promise<void>
	abstract deleteFAQItem(
		companyId: string,
		categoryId: string,
		itemId: string
	): Promise<void>
	abstract deleteCategory(companyId: string, categoryId: string): Promise<void>
	abstract findCategories(companyId: string): Promise<FAQCategory[]>
	abstract findCategoryByNameOrThrow(
		companyId: string,
		name: string
	): Promise<FAQCategory>
	abstract findItemsByCategoryName(
		companyId: string,
		categoryName: string
	): Promise<FAQItem[]>
	abstract findItemsByCategory(
		companyId: string,
		categoryId: string
	): Promise<FAQItem[]>
}
