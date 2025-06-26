import { Conversation } from '@/domain/entities/conversation'
import { FAQItem } from '@/domain/entities/faq'
import { formatMenuOptions } from '@/utils/menu'
import { MenuOption } from '../../@types'
import {
    ConversationState,
    ConversationStateConfig,
    conversationStateDefaultConfig,
} from './conversation-state'
import { StateTransition } from './state-transition'

type FAQItemsStateProps = {
    categoryName: string
    items: FAQItem[]
}

export class FAQItemsState extends ConversationState<FAQItemsStateProps> {
    private menuOptions: MenuOption[]

    constructor(
        conversation: Conversation,
        private categoryName: string,
        private items: FAQItem[],
        config: ConversationStateConfig = conversationStateDefaultConfig
    ) {
        super(conversation, { categoryName, items }, config)

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

    shouldAutoTransition(): boolean {
        return true
    }

    getAutoTransition(): StateTransition {
        return StateTransition.toFAQCategories()
    }

    onEnter() {
        if (!this.config.outputPort) {
            throw new Error('Output port not set')
        }

        this.config.outputPort.handle(
            this.conversation.user,
            `${formatMenuOptions(this.menuOptions)}`
        )
    }
}
