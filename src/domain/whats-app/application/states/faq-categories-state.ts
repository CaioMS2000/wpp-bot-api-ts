import { Conversation } from '@/domain/entities/conversation'
import { FAQCategory } from '@/domain/entities/faq'
import { MenuOption } from '../../@types'
import { ConversationState } from './conversation-state'
import { StateTransition } from './state-transition'

export class FAQCategoriesState extends ConversationState {
    private menuOptions: MenuOption[]

    constructor(
        conversation: Conversation,
        private categories: FAQCategory[]
    ) {
        super(conversation)

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

    handleMessage(messageContent: string): StateTransition {
        if (messageContent === 'Menu principal') {
            return StateTransition.toInitialMenu()
        }

        const correspondingCategory = this.categories.find(
            category => category.name === messageContent
        )

        if (!correspondingCategory) {
            return StateTransition.stayInCurrent()
        }

        return StateTransition.toFAQItems(correspondingCategory.name)
    }

    get entryMessage() {
        return this.formatMenuOptions(this.menuOptions)
    }
}
