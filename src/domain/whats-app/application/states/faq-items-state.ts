import { Conversation } from '@/domain/entities/conversation'
import { ConversationState } from './conversation-state'
import { FAQItem } from '@/domain/entities/faq'
import { StateTransition } from './state-transition'
import { MenuOption, StateInfo } from '../../@types'

export class FAQItemsState extends ConversationState {
    constructor(
        conversation: Conversation,
        private categoryName: string,
        private items: FAQItem[]
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

    getStateInfo(): StateInfo {
        return {
            name: 'faq_items',
            requiresExternalData: false,
            nextPossibleStates: ['faq_categories', 'initial_menu'],
        }
    }

    getMenuOptions(): MenuOption[] {
        return [
            { key: '0', label: 'Voltar para categorias' },
            { key: 'menu', label: 'Menu principal' },
        ]
    }

    getFAQContent(): string {
        let content = `*${this.categoryName}*\n\n`
        this.items.forEach((item, index) => {
            content += `*${index + 1}. ${item.question}*\n`
            content += `${item.answer}\n\n`
        })
        return content
    }
}
