import { Conversation } from '@/domain/entities/conversation'
import { MenuOption, StateInfo } from '../../@types'
import { ConversationState } from './conversation-state'
import { StateTransition } from './state-transition'
import { FAQ } from '@/domain/entities/faq'

export class FAQItemsState extends ConversationState {
    constructor(
        conversation: Conversation,
        private categoryName: string,
        private faqData: FAQ
    ) {
        super(conversation)
    }

    handleMessage(messageContent: string): StateTransition {
        const normalized = messageContent.toLowerCase().trim()

        if (normalized.includes('voltar') || normalized === '0') {
            return StateTransition.toFAQCategories()
        }

        if (normalized.includes('menu') || normalized.includes('início')) {
            return StateTransition.toInitialMenu()
        }

        return StateTransition.stayInCurrent(
            "Digite 'voltar' para ver outras categorias ou 'menu' para o menu principal"
        )
    }

    getMenuOptions(): MenuOption[] {
        return [
            { key: '0', label: 'Voltar para categorias' },
            { key: 'menu', label: 'Menu principal' },
        ]
    }

    getStateInfo(): StateInfo {
        return {
            name: 'faq_items',
            requiresExternalData: false,
            nextPossibleStates: ['faq_categories', 'initial_menu'],
        }
    }

    getFAQContent(): string {
        const category = this.faqData.getCategoryByName(this.categoryName)
        if (!category) return 'Categoria não encontrada'

        let content = `*${category.name}*\n\n`
        category.items.forEach((item, index) => {
            content += `*${index + 1}. ${item.question}*\n`
            content += `${item.answer}\n\n`
        })

        return content
    }
}
