import {
	FaqCategoryFull,
	FaqEntry,
	FaqEntryFull,
	FaqRepository,
} from '@/repository/FaqRepository'
import { PrismaClient } from '@prisma/client'

/**
 * Prisma-based implementation of the FAQ repository.
 */
export class PrismaFaqRepository implements FaqRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async getCategoriesForTenant(tenantId: string): Promise<string[]> {
		const categories = await this.prisma.faqCategory.findMany({
			where: { tenantId },
			select: { name: true },
		})
		return categories.map(c => c.name)
	}

	async getFaqForCategory(
		tenantId: string,
		category: string
	): Promise<FaqEntry[]> {
		const entries = await this.prisma.faqEntry.findMany({
			where: {
				category: {
					is: {
						tenantId,
						name: category,
					},
				},
			},
			select: { question: true, answer: true },
		})
		return entries
	}

	async createCategory(
		tenantId: string,
		name: string
	): Promise<FaqCategoryFull> {
		const cat = await this.prisma.faqCategory.create({
			data: { tenantId, name },
			select: { id: true, name: true },
		})
		return cat
	}

	async updateCategory(
		tenantId: string,
		id: string,
		name: string
	): Promise<FaqCategoryFull> {
		const cat = await this.prisma.faqCategory.update({
			where: { id },
			data: { name },
			select: { id: true, name: true },
		})
		return cat
	}

	async getCategory(
		tenantId: string,
		id: string
	): Promise<FaqCategoryFull | null> {
		const cat = await this.prisma.faqCategory.findFirst({
			where: { id, tenantId },
			select: { id: true, name: true },
		})
		return cat ?? null
	}

	async listCategories(tenantId: string): Promise<FaqCategoryFull[]> {
		return this.prisma.faqCategory.findMany({
			where: { tenantId },
			orderBy: { name: 'asc' },
			select: { id: true, name: true },
		})
	}

	async removeCategory(tenantId: string, id: string): Promise<void> {
		// Delete entries first to avoid FK constraint issues
		await this.prisma.faqEntry.deleteMany({
			where: { categoryId: id, category: { is: { tenantId } } },
		})
		await this.prisma.faqCategory.delete({ where: { id } })
	}

	async createEntry(
		tenantId: string,
		categoryId: string,
		question: string,
		answer: string
	): Promise<FaqEntryFull> {
		const entry = await this.prisma.faqEntry.create({
			data: { categoryId, question, answer },
			select: { id: true, question: true, answer: true, categoryId: true },
		})
		return entry
	}

	async updateEntry(
		tenantId: string,
		id: string,
		data: { question?: string; answer?: string; categoryId?: string }
	): Promise<FaqEntryFull> {
		const entry = await this.prisma.faqEntry.update({
			where: { id },
			data,
			select: { id: true, question: true, answer: true, categoryId: true },
		})
		return entry
	}

	async getEntry(tenantId: string, id: string): Promise<FaqEntryFull | null> {
		const entry = await this.prisma.faqEntry.findFirst({
			where: { id, category: { is: { tenantId } } },
			select: { id: true, question: true, answer: true, categoryId: true },
		})
		return entry ?? null
	}

	async listEntries(
		tenantId: string,
		categoryId: string
	): Promise<FaqEntryFull[]> {
		return this.prisma.faqEntry.findMany({
			where: { categoryId, category: { is: { tenantId } } },
			orderBy: { question: 'asc' },
			select: { id: true, question: true, answer: true, categoryId: true },
		})
	}

	async removeEntry(tenantId: string, id: string): Promise<void> {
		await this.prisma.faqEntry.delete({ where: { id } })
	}
}
