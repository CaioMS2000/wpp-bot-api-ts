import { Company } from '@/domain/entities/company'
import { FAQCategory, FAQItem } from '@/domain/entities/faq'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { prisma } from '@/lib/prisma'
import { FAQMapper } from '../../mapper/faq-mapper'

export class PrismaFAQRepository extends FAQRepository {
    async save(
        company: Company,
        category: string,
        question: string,
        answer: string
    ): Promise<void> {
        const cat = await prisma.fAQCategory.upsert({
            where: {
                companyId_name: {
                    companyId: company.id,
                    name: category,
                },
            },
            update: {},
            create: {
                name: category,
                companyId: company.id,
            },
        })

        await prisma.fAQItem.create({
            data: {
                question,
                answer,
                categoryId: cat.id,
            },
        })
    }

    async findCategories(company: Company): Promise<FAQCategory[]> {
        const categories = await prisma.fAQCategory.findMany({
            where: { companyId: company.id },
            include: { items: true },
        })

        return FAQMapper.toEntity(categories).categories
    }

    async findItemsByCategory(
        company: Company,
        categoryName: string
    ): Promise<FAQItem[]> {
        const category = await prisma.fAQCategory.findUnique({
            where: {
                companyId_name: {
                    companyId: company.id,
                    name: categoryName,
                },
            },
            include: { items: true },
        })

        if (!category) return []

        return category.items.map(item => ({
            question: item.question,
            answer: item.answer,
        }))
    }
}
