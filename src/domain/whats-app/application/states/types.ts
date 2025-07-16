import { AIChatState } from './ai-chat-state'
import { DepartmentChatState } from './client-only/department-chat-state'
import { DepartmentQueueState } from './client-only/department-queue-state'
import { DepartmentSelectionState } from './client-only/department-selection-state'
import { ChatWithClientState } from './employee-only/chat-with-client-sate'
import { ListDepartmentQueueState } from './employee-only/list-department-client-queue-state'
import { FAQCategoriesState } from './faq-categories-state'
import { FAQItemsState } from './faq-items-state'
import { InitialMenuState } from './initial-menu-state'

export type StateTypeMapper =
    | { stateName: 'DepartmentChatState'; params: { departmentId: string } }
    | { stateName: 'DepartmentQueueState'; params: { departmentId: string } }
    | {
          stateName: 'ChatWithClientState'
          params: { clientPhoneNumber: string }
      }
    | {
          stateName: 'ListDepartmentQueueState'
          params: { departmentId: string }
      }
    | { stateName: 'FAQItemsState'; params: { categoryName: string } }
    | { stateName: 'AIChatState' }
    | { stateName: 'DepartmentSelectionState' }
    | { stateName: 'FAQCategoriesState' }
    | { stateName: 'InitialMenuState' }
