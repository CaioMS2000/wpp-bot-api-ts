import { Company } from '@/domain/entities/company'
import { FAQCategory, FAQItem } from '@/domain/entities/faq'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { prisma } from '@/lib/prisma'

export class PrismaFAQRepository extends FAQRepository {
    async save(
        company: Company,
        category: string,
        question: string,
        answer: string
    ): Promise<void> {
        const existingCategory = await prisma.fAQCategory.findFirst({
            where: {
                companyId: company.id,
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
                    companyId: company.id,
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

    async findCategories(company: Company): Promise<FAQCategory[]> {
        const categories = await prisma.fAQCategory.findMany({
            where: {
                companyId: company.id,
            },
            include: {
                items: true,
            },
        })

        return categories.map(cat => ({
            name: cat.name,
            items: cat.items.map(item => ({
                question: item.question,
                answer: item.answer,
            })),
        }))
    }

    async findItemsByCategory(
        company: Company,
        categoryName: string
    ): Promise<FAQItem[]> {
        const category = await prisma.fAQCategory.findFirst({
            where: {
                companyId: company.id,
                name: categoryName,
            },
            include: {
                items: true,
            },
        })

        if (!category) return []

        return category.items.map(item => ({
            question: item.question,
            answer: item.answer,
        }))
    }
}
