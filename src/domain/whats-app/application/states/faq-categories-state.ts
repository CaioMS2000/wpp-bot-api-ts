import { logger } from '@/core/logger'
import { Conversation } from '@/domain/entities/conversation'
import { FAQCategory } from '@/domain/entities/faq'
import { MenuOption } from '../../@types'
import {
    ConversationState,
    ConversationStateConfig,
    conversationStateDefaultConfig,
} from './conversation-state'
import { StateTransition } from './state-transition'
import { formatMenuOptions } from '@/utils/menu'

type FAQCategoriesStateProps = { categories: FAQCategory[] }

export class FAQCategoriesState extends ConversationState<FAQCategoriesStateProps> {
    private menuOptions: MenuOption[]

    constructor(
        conversation: Conversation,
        categories: FAQCategory[],
        config: ConversationStateConfig = conversationStateDefaultConfig
    ) {
        super(conversation, { categories }, config)

        this.menuOptions = categories
            .map((category, index) => ({
                key: (index + 1).toString(),
                label: category.name,
                forClient: true,
                forEmployee: true,
            }))
            .concat([
                {
                    key: 'menu',
                    label: 'Menu principal',
                    forClient: true,
                    forEmployee: true,
                },
            ])
    }

    get categories() {
        return this.props.categories
    }

    handleMessage(messageContent: string): StateTransition {
        if (messageContent === 'Menu principal') {
            return StateTransition.toInitialMenu()
        }

        const correspondingCategory = this.categories.find(
            category => category.name === messageContent
        )

        if (!correspondingCategory) {
            logger.debug(
                `[FAQCategoriesState] no corresponding category for: ${messageContent}`
            )
            return StateTransition.stayInCurrent()
        }

        return StateTransition.toFAQItems(correspondingCategory.name)
    }

    onEnter() {
        if (!this.config.outputPort) {
            throw new Error('Output port not set')
        }

        this.config.outputPort.handle(
            this.conversation.user,
            formatMenuOptions(this.menuOptions)
        )
    }
}
