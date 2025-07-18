import { StateName } from 'ROOT/prisma/generated'

export const fromDomainToPrisma = (
    from: 'client' | 'employee' | 'AI'
): 'CLIENT' | 'EMPLOYEE' | 'AI' => {
    return from.toUpperCase() as 'CLIENT' | 'EMPLOYEE' | 'AI'
}
export const stateNameToPrismaEnum: Record<string, StateName> = {
    InitialMenuState: 'initial_menu',
    FAQItemsState: 'faq_items',
    FAQCategoriesState: 'faq_categories',
    AIChatState: 'ai_chat',
    ListDepartmentQueueState: 'department_queue_list',
    ChatWithClientState: 'chat_with_client',
    DepartmentSelectionState: 'department_selection',
    DepartmentQueueState: 'department_queue',
    DepartmentChatState: 'department_chat',
}
// export const stateNameToPrismaEnum: Record<string, string> = {
//     InitialMenuState: 'initial_menu',
//     FAQItemsState: 'faq_items',
//     FAQCategoriesState: 'faq_categories',
//     AIChatState: 'ai_chat',
//     ListDepartmentQueueState: 'list_department_queue',
//     ChatWithClientState: 'chat_with_client',
//     DepartmentSelectionState: 'department_selection',
//     DepartmentQueueState: 'department_queue',
//     DepartmentChatState: 'department_chat',
// }
