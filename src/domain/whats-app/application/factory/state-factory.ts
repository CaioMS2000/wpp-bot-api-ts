import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { FAQCategory, FAQItem } from '@/domain/entities/faq'

import { logger } from '@/core/logger'
import {
    isClient,
    isDepartment,
    isDepartmentArray,
    isEmployee,
    isFAQItem,
} from '@/utils/entity'
import { AIChatState } from '../states/ai-chat-state'
import { DepartmentChatState } from '../states/client-only/department-chat-state'
import { DepartmentQueueState } from '../states/client-only/department-queue-state'
import { DepartmentSelectionState } from '../states/client-only/department-selection-state'
import { ConversationState } from '../states/conversation-state'
import { ChatWithClientState } from '../states/employee-only/chat-with-client-sate'
import { ListDepartmentQueueState } from '../states/employee-only/list-department-client-queue-state'
import { FAQCategoriesState } from '../states/faq-categories-state'
import { FAQItemsState } from '../states/faq-items-state'
import { InitialMenuState } from '../states/initial-menu-state'

export type StateName =
    | 'initial_menu'
    | 'ai_chat'
    | 'faq_categories'
    | 'faq_items'
    | 'department_selection'
    | 'department_queue'
    | 'department_chat'
    | 'department_queue_list'
    | 'chat_with_client'

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
                if (!isDepartmentArray(data)) {
                    throw new Error(
                        'Data must be an array of Department objects'
                    )
                }

                return new DepartmentSelectionState(conversation, data)
            }

            case 'department_queue': {
                if (!isDepartment(data)) {
                    throw new Error('Data must be a Department object')
                }

                return new DepartmentQueueState(conversation, data)
            }
            case 'department_chat': {
                if (!isDepartment(data)) {
                    throw new Error('Data must be a Department object')
                }

                return new DepartmentChatState(conversation, data)
            }
            case 'department_queue_list': {
                logger.print(
                    '[StateFactory.create] department_queue_list\n',
                    conversation
                )
                if (isEmployee(conversation.user)) {
                    if (!isDepartment(conversation.user.department)) {
                        logger.error(
                            data,
                            new Error('Data must be a Department object')
                        )
                        throw new Error('Data must be a Department object')
                    }

                    return new ListDepartmentQueueState(
                        conversation,
                        conversation.user.department
                    )
                }

                throw new Error(
                    "'department_queue_list' is only available for employees"
                )
            }

            case 'chat_with_client':
                if (!isClient(data)) {
                    throw new Error('Data must be a Client object')
                }

                return new ChatWithClientState(conversation, data)

            case 'ai_chat':
                return new AIChatState(conversation)

            default:
                throw new Error(`Unknown state: ${name}`)
        }
    }

    private static isFAQCategory(category: unknown): category is FAQCategory {
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
