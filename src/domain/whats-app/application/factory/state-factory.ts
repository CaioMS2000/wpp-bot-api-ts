import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { FAQCategory, FAQItem } from '@/domain/entities/faq'

import { logger } from '@/core/logger'
import { OutputPort } from '@/core/output/output-port'
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
import { FAQItemsState, FAQItemsStateProps } from '../states/faq-items-state'
import { InitialMenuState } from '../states/initial-menu-state'
import { StateDataMap, StateName } from './types'
import { Client } from '@/domain/entities/client'
import { ListFAQCategoriesUseCase } from '../use-cases/list-faq-categories-use-case'
import { ListFAQCategorieItemsUseCase } from '../use-cases/list-faq-categorie-items-use-case'

export class StateFactory {
    constructor(
        private listFAQCategoriesUseCase: ListFAQCategoriesUseCase,
        private listFAQCategorieItemsUseCase: ListFAQCategorieItemsUseCase
    ) {}
    create<K extends StateName>(
        name: K,
        conversation: Conversation,
        outputPort: OutputPort,
        ...args: StateDataMap[K] extends null ? [] : [data: StateDataMap[K]]
    ): ConversationState {
        const data = args[0] as StateDataMap[K]

        switch (name) {
            case 'initial_menu':
                return new InitialMenuState(conversation, outputPort)

            case 'ai_chat':
                return new AIChatState(conversation, outputPort)

            case 'faq_categories': {
                return new FAQCategoriesState(
                    conversation,
                    outputPort,
                    this.listFAQCategoriesUseCase
                )
            }

            case 'faq_items': {
                const { categoryName } = data as FAQItemsStateProps
                return new FAQItemsState(
                    conversation,
                    outputPort,
                    this.listFAQCategorieItemsUseCase,
                    categoryName
                )
            }

            case 'department_selection': {
                data
                const { departments } = data as { departments: Department[] }
                return new DepartmentSelectionState(
                    conversation,
                    outputPort,
                    departments
                )
            }

            case 'department_queue': {
                const { department } = data as { department: Department }
                return new DepartmentQueueState(
                    conversation,
                    outputPort,
                    department
                )
            }

            case 'department_chat': {
                const { department } = data as { department: Department }
                return new DepartmentChatState(
                    conversation,
                    department,
                    outputPort
                )
            }

            case 'department_queue_list': {
                if (!isEmployee(conversation.user)) {
                    throw new Error(
                        "'department_queue_list' is only available for employees"
                    )
                }

                const { department } = data as { department: Department }
                return new ListDepartmentQueueState(
                    conversation,
                    outputPort,
                    department
                )
            }

            case 'chat_with_client': {
                const { client } = data as { client: Client }
                return new ChatWithClientState(conversation, client, outputPort)
            }

            default:
                throw new Error(`Unknown state: ${name satisfies never}`)
        }
    }
}
