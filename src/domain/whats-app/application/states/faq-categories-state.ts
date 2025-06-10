import { Conversation } from '@/domain/entities/conversation'
import { FAQCategory } from '@/domain/entities/faq'
import { MenuOption } from '../../@types'
import { ConversationState } from './conversation-state'
import { StateTransition } from './state-transition'

export class FAQCategoriesState extends ConversationState {
    constructor(
        conversation: Conversation,
        private categories: FAQCategory[]
    ) {
        super(conversation)
    }

    handleMessage(messageContent: string): StateTransition {
        console.log('FAQCategoriesState')
        console.log('messageContent')
        console.log(messageContent)

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

    getResponse(): string {
        return this.formatMenuOptions(
            this.categories
                .map((category, index) => ({
                    key: (index + 1).toString(),
                    label: category.name,
                }))
                .concat([{ key: 'menu', label: 'Menu principal' }])
        )
    }
}
