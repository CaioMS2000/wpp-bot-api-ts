import { Department } from '@/domain/entities/department'
import { FAQItemsStateProps } from '../states/faq-items-state'
import { Client } from '@/domain/entities/client'

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

export type TransitionIntent = {
    target: StateName
}

export type StateDataMap = {
    initial_menu: null
    ai_chat: null
    faq_categories: { categories: string[] }
    faq_items: FAQItemsStateProps
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

// hack to make TS validate keys of type
type MissingKeys = Exclude<StateName, keyof StateDataMap>
type ExtraKeys = Exclude<keyof StateDataMap, StateName>

type AssertValidStateDataMap = MissingKeys extends never
    ? ExtraKeys extends never
        ? true
        : ['❌ StateDataMap has invalid extra keys:', ExtraKeys]
    : ['❌ StateDataMap is missing keys:', MissingKeys]

const _assert: AssertValidStateDataMap = true
