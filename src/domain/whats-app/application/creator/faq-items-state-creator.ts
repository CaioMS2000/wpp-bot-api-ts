import { Conversation } from '@/domain/entities/conversation'
import { ConversationState } from '../states/conversation-state'
import { StateCreator } from './state-creator'
import { FAQItem } from '@/domain/entities/faq'
import { FAQItemsState } from '../states/faq-items-state'
import { isFAQItem } from '@/utils/entity'

export class FAQItemsStateCreator implements StateCreator {
    create(conversation: Conversation, data?: unknown): ConversationState {
        this.validate(data)

        const [categoryName, items] = data as [string, FAQItem[]]

        return new FAQItemsState(conversation, categoryName, items)
    }
    validate(data: unknown) {
        if (!FAQItemsStateCreator.isCategoryTuple(data)) {
            throw new Error(
                'Data must be in the format [categoryName: string, items: FAQItem[]] ' +
                    'where FAQItem is { question: string, answer: string }'
            )
        }
    }

    private static isCategoryTuple(data: unknown): data is [string, FAQItem[]] {
        return (
            Array.isArray(data) &&
            data.length === 2 &&
            typeof data[0] === 'string' &&
            Array.isArray(data[1]) &&
            data[1].every(isFAQItem)
        )
    }
}
