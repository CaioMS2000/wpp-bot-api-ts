import { FAQRepository } from '@/domain/repositories/faq-repository'

export class ListFAQCategorieItemsUseCase {
    constructor(private faqRepository: FAQRepository) {}

    async execute(categoryName: string) {
        const items = await this.faqRepository.findItemsByCategory(categoryName)

        return items
    }
}
