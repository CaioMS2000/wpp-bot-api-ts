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
import { StateCreator } from '../creator/state-creator'
import { FAQCategoriesStateCreator } from '../creator/faq-categories-state-creator'
import { InitialMenuStateCreator } from '../creator/initial-menu-state-creator'
import { isDepartment, isDepartmentArray, isFAQItem } from '@/utils/entity'
import { FAQItemsStateCreator } from '../creator/faq-items-state-creator'
import { DepartmentSelectionStateCreator } from '../creator/department-selection-state-creator'
import { DepartmentQueueStateCreator } from '../creator/department-queue-state-creator'
import { AIChatStateCreator } from '../creator/ai-chat-state-creator'
import { DepartmentChatStateCreator } from '../creator/department-chat-state-creator'
import { ListDepartmentQueueStateCreator } from '../creator/list-department-client-queue-state-creator'
import { logger } from '@/core/logger'

export type StateName =
    | 'initial_menu'
    | 'ai_chat'
    | 'faq_categories'
    | 'faq_items'
    | 'department_selection'
    | 'department_queue'
    | 'department_chat'
    | 'department_queue_list'

export class StateFactory {
    private static creators: Record<StateName, StateCreator> = {
        initial_menu: new InitialMenuStateCreator(),
        ai_chat: new AIChatStateCreator(),
        faq_categories: new FAQCategoriesStateCreator(),
        faq_items: new FAQItemsStateCreator(),
        department_selection: new DepartmentSelectionStateCreator(),
        department_queue: new DepartmentQueueStateCreator(),
        department_chat: new DepartmentChatStateCreator(),
        department_queue_list: new ListDepartmentQueueStateCreator(),
    }

    static create(
        name: StateName,
        conversation: Conversation,
        data?: unknown
    ): ConversationState {
        const creator = StateFactory.creators[name]

        if (!creator) {
            throw new Error(`Unknown state name: ${name}`)
        }

        logger.print('State creator:\n', creator)

        return creator.create(conversation, data)
    }
}
