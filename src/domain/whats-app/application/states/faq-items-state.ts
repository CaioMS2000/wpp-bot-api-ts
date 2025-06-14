import { Conversation } from '@/domain/entities/conversation'
import { FAQItem } from '@/domain/entities/faq'
import { MenuOption } from '../../@types'
import { ConversationState } from './conversation-state'
import { StateTransition } from './state-transition'

export class FAQItemsState extends ConversationState {
    private menuOptions: MenuOption[]

    constructor(
        conversation: Conversation,
        private categoryName: string,
        private items: FAQItem[]
    ) {
        super(conversation)

        this.menuOptions = items.map((item, index) => ({
            key: (index + 1).toString(),
            label: `${item.question}\n${item.answer}`,
            forClient: true,
            forEmployee: true,
        }))
    }

    handleMessage(messageContent: string): StateTransition {
        throw new Error('Method not implemented.')
    }

    get entryMessage(): string {
        return this.formatMenuOptions(this.menuOptions)
    }

    shouldAutoTransition(): boolean {
        return true
    }

    getAutoTransition(): StateTransition {
        return StateTransition.toFAQCategories()
    }
}
