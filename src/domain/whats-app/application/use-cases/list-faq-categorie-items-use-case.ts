import { Company } from '@/domain/entities/company'
import { FAQRepository } from '@/domain/repositories/faq-repository'

export class ListFAQCategorieItemsUseCase {
    constructor(private faqRepository: FAQRepository) {}

    async execute(company: Company, categoryName: string) {
        const items = await this.faqRepository.findItemsByCategory(
            company,
            categoryName
        )

        return items
    }
}
