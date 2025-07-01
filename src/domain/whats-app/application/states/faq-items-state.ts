import { OutputMessage } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { FAQItem } from '@/domain/entities/faq'
import { formatMenuOptions } from '@/utils/menu'
import { execute } from '@caioms/ts-utils/functions'
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
    constructor(
        conversation: Conversation,
        private categoryName: string,
        private items: FAQItem[],
        config: ConversationStateConfig = conversationStateDefaultConfig
    ) {
        super(conversation, { categoryName, items }, config)
    }

    async handleMessage(messageContent: string): Promise<StateTransition> {
        throw new Error('Method not implemented.')
    }

    shouldAutoTransition(): boolean {
        return true
    }

    getAutoTransition(): StateTransition {
        return StateTransition.toFAQCategories()
    }

    async onEnter() {
        if (!this.config.outputPort) {
            throw new Error('Output port not set')
        }

        const textOutput: OutputMessage = {
            type: 'text',
            content: this.items.reduce((acc, item) => {
                return `${acc}*${item.question}*\n${item.answer}\n\n`
            }, `*FAQ - ${this.categoryName}*\n\n`),
        } as const

        // this.config.outputPort.handle(this.conversation.user, textOutput)
        await execute(
            this.config.outputPort.handle,
            this.conversation.user,
            textOutput
        )
    }
}
