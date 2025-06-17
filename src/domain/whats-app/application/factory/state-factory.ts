import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { FAQCategory, FAQItem } from '@/domain/entities/faq'

import { AIChatState } from '../states/ai-chat-state'
import { DepartmentChatState } from '../states/client-only/department-chat-state'
import { DepartmentQueueState } from '../states/client-only/department-queue-state'
import { DepartmentSelectionState } from '../states/client-only/department-selection-state'
import { ConversationState } from '../states/conversation-state'
import { FAQCategoriesState } from '../states/faq-categories-state'
import { FAQItemsState } from '../states/faq-items-state'
import { InitialMenuState } from '../states/initial-menu-state'
import { ListDepartmentQueueState } from '../states/employee-only/list-department-client-queue-state'

export type StateName =
    | 'initial_menu'
    | 'faq_categories'
    | 'faq_items'
    | 'department_selection'
    | 'department_queue'
    | 'department_chat'
    | 'ai_chat'
    | 'department_queue_list'

export class StateFactory {
    static create(
        name: StateName,
        conversation: Conversation,
        data?: unknown
    ): ConversationState {
        switch (name) {
            case 'initial_menu':
                return new InitialMenuState(conversation)

            case 'faq_categories': {
                if (!Array.isArray(data)) {
                    throw new Error(
                        'Data for faq_categories must be an array of FAQCategory objects'
                    )
                }

                if (!data.every(StateFactory.isFAQCategory)) {
                    throw new Error(
                        'Invalid FAQCategory format. Expected { name: string, items: FAQItem[] } ' +
                            'where FAQItem is { question: string, answer: string }'
                    )
                }

                return new FAQCategoriesState(
                    conversation,
                    data as FAQCategory[]
                )
            }

            case 'faq_items': {
                if (!StateFactory.isCategoryTuple(data)) {
                    throw new Error(
                        'Data must be in the format [categoryName: string, items: FAQItem[]] ' +
                            'where FAQItem is { question: string, answer: string }'
                    )
                }

                const [categoryName, items] = data
                return new FAQItemsState(conversation, categoryName, items)
            }

            case 'department_selection': {
                if (!StateFactory.isDepartmentArray(data)) {
                    throw new Error(
                        'Data must be an array of Department objects'
                    )
                }

                return new DepartmentSelectionState(conversation, data)
            }

            case 'department_queue':
            case 'department_chat': {
                if (!StateFactory.isDepartment(data)) {
                    throw new Error('Data must be a Department object')
                }

                return name === 'department_queue'
                    ? new DepartmentQueueState(conversation, data)
                    : new DepartmentChatState(conversation, data)
            }

            case 'ai_chat':
                return new AIChatState(conversation)

            case 'department_queue_list':
                if (!StateFactory.isDepartment(data)) {
                    throw new Error('Data must be a Department object')
                }
                return new ListDepartmentQueueState(conversation, data)

            default:
                throw new Error(`Unknown state: ${name}`)
        }
    }

    private static isFAQItem(item: unknown): item is FAQItem {
        return (
            typeof item === 'object' &&
            item !== null &&
            'question' in item &&
            'answer' in item &&
            typeof item.question === 'string' &&
            typeof item.answer === 'string'
        )
    }

    private static isFAQCategory(category: unknown): category is FAQCategory {
        return (
            typeof category === 'object' &&
            category !== null &&
            'name' in category &&
            'items' in category &&
            typeof category.name === 'string' &&
            Array.isArray(category.items) &&
            category.items.every(StateFactory.isFAQItem)
        )
    }

    private static isCategoryTuple(data: unknown): data is [string, FAQItem[]] {
        return (
            Array.isArray(data) &&
            data.length === 2 &&
            typeof data[0] === 'string' &&
            Array.isArray(data[1]) &&
            data[1].every(StateFactory.isFAQItem)
        )
    }

    private static isDepartment(data: unknown): data is Department {
        return data instanceof Department
    }

    private static isDepartmentArray(data: unknown): data is Department[] {
        return Array.isArray(data) && data.every(StateFactory.isDepartment)
    }
}
