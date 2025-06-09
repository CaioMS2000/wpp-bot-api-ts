import { Conversation } from '@/domain/entities/conversation'
import { ConversationState } from './conversation-state'
import { MenuOption, StateInfo } from '../../@types'
import { StateTransition } from './state-transition'
import { FAQCategory } from '@/domain/entities/faq'

export class FAQCategoriesState extends ConversationState {
    constructor(
        conversation: Conversation,
        private categories: FAQCategory[]
    ) {
        super(conversation)
    }

    handleMessage(messageContent: string): StateTransition {
        const selectedCategory = this.findCategoryByMessage(messageContent)

        if (selectedCategory) {
            return StateTransition.toFAQItems(selectedCategory)
        }

        return StateTransition.stayInCurrent('Categoria não encontrada')
    }

    private findCategoryByMessage(message: string): string | null {
        const normalized = message.toLowerCase().trim()
        const categoryNames = this.categories.map(category => category.name)

        // Try by number first
        const numberMatch = normalized.match(/^\d+$/)
        if (numberMatch) {
            const index = Number.parseInt(numberMatch[0]) - 1
            return categoryNames[index] || null
        }

        // Try by name
        const category = this.categories.find(cat =>
            cat.name.toLowerCase().includes(normalized)
        )
        return category?.name || null
    }

    getMenuOptions(): MenuOption[] {
        return this.categories.map((category, index) => ({
            key: (index + 1).toString(),
            label: category.name,
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
