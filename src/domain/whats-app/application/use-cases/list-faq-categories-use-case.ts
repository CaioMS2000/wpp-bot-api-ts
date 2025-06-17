import { FAQRepository } from '@/domain/repositories/faq-repository'

export class ListFAQCategoriesUseCase {
    constructor(private faqRepository: FAQRepository) {}

    async execute() {
        const categories = await this.faqRepository.findCategories()

        return categories
    }
}
