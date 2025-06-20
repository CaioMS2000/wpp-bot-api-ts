import { Prisma } from '../prisma/generated'

import { groupedFaqs } from './grouped-faqs'

export async function seedFAQs(prisma: Prisma.TransactionClient) {
    const company = await prisma.company.findFirstOrThrow()
    const companyId = company.id

    for (const category of groupedFaqs) {
        const createdCategory = await prisma.fAQCategory.upsert({
            where: {
                companyId_name: {
                    name: category.name,
                    companyId,
                },
            },
            update: {},
            create: {
                name: category.name,
                companyId,
                items: {
                    create: category.items.map(item => ({
                        question: item.question,
                        answer: item.answer,
                    })),
                },
            },
            include: { items: true },
        })

        console.log(
            `✅ Categoria "${createdCategory.name}" criada com ${createdCategory.items.length} perguntas`
        )
    }
}
