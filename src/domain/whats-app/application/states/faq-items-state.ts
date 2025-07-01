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
import { OutputMessage } from '@/core/output/output-port'

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

        const listOutput: OutputMessage = {
            type: 'list',
            text: `Categoria: ${this.categoryName}`,
            buttonText: 'Ver',
            sections: [
                {
                    title: 'Items',
                    rows: this.menuOptions.map(opt => ({
                        id: opt.key,
                        title: opt.label,
                    })),
                },
            ],
        } as const

        this.config.outputPort.handle(this.conversation.user, listOutput)
    }
}
