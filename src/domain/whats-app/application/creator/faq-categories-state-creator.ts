import { FAQCategory, FAQItem } from '@/domain/entities/faq'
import { StateCreator } from './state-creator'
import { ConversationState } from '../states/conversation-state'
import { Conversation } from '@/domain/entities/conversation'
import { FAQCategoriesState } from '../states/faq-categories-state'
import { isFAQItem } from '@/utils/entity'

export class FAQCategoriesStateCreator implements StateCreator {
    validate(data?: unknown): void {
        if (!Array.isArray(data)) {
            throw new Error(
                'Data for faq_categories must be an array of FAQCategory objects'
            )
        }

        if (!data.every(this.isFAQCategory)) {
            throw new Error('Invalid FAQCategory format')
        }
    }

    create(conversation: Conversation, data?: unknown): ConversationState {
        this.validate(data)
        return new FAQCategoriesState(conversation, data as FAQCategory[])
    }

    private isFAQCategory(category: unknown): category is FAQCategory {
        return (
            typeof category === 'object' &&
            category !== null &&
            'name' in category &&
            'items' in category &&
            typeof category.name === 'string' &&
            Array.isArray(category.items) &&
            category.items.every(isFAQItem)
        )
    }
}
