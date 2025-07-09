import { Department } from '@/domain/entities/department'
import { Client } from '@/domain/entities/client'
import { AIChatState } from '../states/ai-chat-state'
import { DepartmentChatState } from '../states/client-only/department-chat-state'
import { DepartmentQueueState } from '../states/client-only/department-queue-state'
import { DepartmentSelectionState } from '../states/client-only/department-selection-state'
import { ChatWithClientState } from '../states/employee-only/chat-with-client-sate'
import { ListDepartmentQueueState } from '../states/employee-only/list-department-client-queue-state'
import { FAQCategoriesState } from '../states/faq-categories-state'
import { FAQItemsState } from '../states/faq-items-state'
import { InitialMenuState } from '../states/initial-menu-state'
import { ConversationState } from '../states/conversation-state'

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

export type StateDataMap = {
    initial_menu: null
    ai_chat: null
    faq_categories: null
    faq_items: {
        categoryName: string
    }
    department_selection: { departments: Department[] }
    department_queue: {
        department: Department
    }
    department_chat: {
        department: Department
    }
    department_queue_list: {
        department: Department
    }
    chat_with_client: {
        client: Client
    }
}

export type StateInstanceMap = {
    initial_menu: InitialMenuState
    ai_chat: AIChatState
    faq_categories: FAQCategoriesState
    faq_items: FAQItemsState
    department_selection: DepartmentSelectionState
    department_queue: DepartmentQueueState
    department_chat: DepartmentChatState
    department_queue_list: ListDepartmentQueueState
    chat_with_client: ChatWithClientState
}
// export type StateInstanceMap = {
//     [K in StateName]: ConversationState<StateDataMap[K]>
// }

export type TransitionIntent = {
    target: StateName
}

// hack to make TS validate keys of type
type MissingKeys = Exclude<StateName, keyof StateDataMap>
type ExtraKeys = Exclude<keyof StateDataMap, StateName>

type AssertValidStateDataMap = MissingKeys extends never
    ? ExtraKeys extends never
        ? true
        : ['❌ StateDataMap has invalid extra keys:', ExtraKeys]
    : ['❌ StateDataMap is missing keys:', MissingKeys]

const _assert: AssertValidStateDataMap = true
