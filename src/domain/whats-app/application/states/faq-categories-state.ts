import { Conversation } from '@/domain/entities/conversation'
import { ConversationState } from './conversation-state'
import { MenuOption, StateInfo } from '../../@types'
import { StateTransition } from './state-transition'
import { FAQ, FAQCategory } from '@/domain/entities/faq'

export class FAQCategoriesState extends ConversationState {
    constructor(
        conversation: Conversation,
        private faqData: FAQ
    ) {
        super(conversation)
    }

    handleMessage(messageContent: string): StateTransition {
        const selectedCategory = this.findCategoryNameByMessage(messageContent)

        if (selectedCategory) {
            return StateTransition.toFAQItems(selectedCategory)
        }

        return StateTransition.stayInCurrent('Categoria não encontrada')
    }

    private findCategoryNameByMessage(message: string): string | null {
        const normalized = message.toLowerCase().trim()
        const categoryNames = this.faqData.getCategoryNames()

        // Tenta por número primeiro
        const numberMatch = normalized.match(/^\d+$/)
        if (numberMatch) {
            const index = Number.parseInt(numberMatch[0]) - 1
            return categoryNames[index] || null
        }

        // Depois por nome parcial
        const categoryFromPartialName =
            this.faqData.findCategoryByPartialName(normalized)

        return categoryFromPartialName?.name || null
    }

    getMenuOptions(): MenuOption[] {
        return this.faqData.getCategoryNames().map((categoryName, index) => ({
            key: (index + 1).toString(),
            label: categoryName,
        }))
    }

    getStateInfo(): StateInfo {
        return {
            name: 'faq_categories',
            requiresExternalData: false, // Dados já foram carregados
            nextPossibleStates: ['faq_items', 'initial_menu'],
        }
    }
}
