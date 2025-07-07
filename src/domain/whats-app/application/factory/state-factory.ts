import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { FAQCategory, FAQItem } from '@/domain/entities/faq'

import { logger } from '@/core/logger'
import { OutputPort } from '@/core/output/output-port'
import { Client } from '@/domain/entities/client'
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
import { ListFAQCategorieItemsUseCase } from '../use-cases/list-faq-categorie-items-use-case'
import { ListFAQCategoriesUseCase } from '../use-cases/list-faq-categories-use-case'
import { assertData } from './assertData'
import { StateDataMap, StateInstanceMap, StateName } from './types'
import { UseCaseFactory } from './use-case-factory'

export class StateFactory {
    private useCaseFactory: UseCaseFactory
    constructor(
        private outputPort: OutputPort,
        useCaseFactory: UseCaseFactory = null as unknown as UseCaseFactory
    ) {
        this.useCaseFactory = useCaseFactory
    }

    setUseCaseFactory(useCaseFactory: UseCaseFactory) {
        this.useCaseFactory = useCaseFactory
    }

    create<K extends StateName>(
        name: K,
        conversation: Conversation,
        ...args: StateDataMap[K] extends null ? [] : [data: StateDataMap[K]]
    ): StateInstanceMap[K] {
        const data = args[0] as StateDataMap[K]

        switch (name) {
            case 'initial_menu': {
                const state = new InitialMenuState(
                    conversation,
                    this.outputPort
                )
                return state as StateInstanceMap[K]
            }

            case 'ai_chat': {
                const state = new AIChatState(conversation, this.outputPort)
                return state as StateInstanceMap[K]
            }

            case 'faq_categories': {
                const state = new FAQCategoriesState(
                    conversation,
                    this.outputPort,
                    this.useCaseFactory.getListFAQCategoriesUseCase()
                )
                logger.info('FAQ Categories State Created')
                return state as StateInstanceMap[K]
            }

            case 'faq_items': {
                const { categoryName } = assertData('faq_items', data)
                const state = new FAQItemsState(
                    conversation,
                    this.outputPort,
                    this.useCaseFactory.getListFAQCategorieItemsUseCase(),
                    categoryName
                )
                return state as StateInstanceMap[K]
            }

            case 'department_selection': {
                const { departments } = assertData('department_selection', data)
                const state = new DepartmentSelectionState(
                    conversation,
                    this.outputPort,
                    departments
                )
                return state as StateInstanceMap[K]
            }

            case 'department_queue': {
                const { department } = assertData('department_queue', data)
                const state = new DepartmentQueueState(
                    conversation,
                    this.outputPort,
                    department
                )
                return state as StateInstanceMap[K]
            }

            case 'department_chat': {
                const { department } = assertData('department_chat', data)
                const state = new DepartmentChatState(
                    conversation,
                    this.outputPort,
                    department
                )
                return state as StateInstanceMap[K]
            }

            case 'department_queue_list': {
                if (!isEmployee(conversation.user)) {
                    throw new Error(
                        "'department_queue_list' is only available for employees"
                    )
                }

                const { department } = assertData('department_queue_list', data)
                const state = new ListDepartmentQueueState(
                    conversation,
                    this.outputPort,
                    department
                )
                return state as StateInstanceMap[K]
            }

            case 'chat_with_client': {
                const { client } = assertData('chat_with_client', data)
                const state = new ChatWithClientState(
                    conversation,
                    client,
                    this.outputPort
                )
                return state as StateInstanceMap[K]
            }

            default:
                throw new Error(`Unknown state: ${name satisfies never}`)
        }
    }
}
