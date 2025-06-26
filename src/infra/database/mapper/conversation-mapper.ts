import { Conversation } from '@/domain/entities/conversation'
import { AIChatState } from '@/domain/whats-app/application/states/ai-chat-state'
import { DepartmentChatState } from '@/domain/whats-app/application/states/client-only/department-chat-state'
import { DepartmentQueueState } from '@/domain/whats-app/application/states/client-only/department-queue-state'
import { DepartmentSelectionState } from '@/domain/whats-app/application/states/client-only/department-selection-state'
import { ConversationState } from '@/domain/whats-app/application/states/conversation-state'
import { ChatWithClientState } from '@/domain/whats-app/application/states/employee-only/chat-with-client-sate'
import { ListDepartmentQueueState } from '@/domain/whats-app/application/states/employee-only/list-department-client-queue-state'
import { FAQCategoriesState } from '@/domain/whats-app/application/states/faq-categories-state'
import { FAQItemsState } from '@/domain/whats-app/application/states/faq-items-state'
import { InitialMenuState } from '@/domain/whats-app/application/states/initial-menu-state'

import {
    Client as PrismaClient,
    Company as PrismaCompany,
    Conversation as PrismaConversation,
    Department as PrismaDepartment,
    Employee as PrismaEmployee,
    Manager as PrismaManager,
    StateName as PrismaStateName,
} from 'ROOT/prisma/generated'
import { ClientMapper } from './client-mapper'
import { CompanyMapper } from './company-mapper'
import { EmployeeMapper } from './employee-mapper'

const stateMap = {
    [PrismaStateName.initial_menu]: InitialMenuState,
    [PrismaStateName.ai_chat]: AIChatState,
    [PrismaStateName.faq_categories]: FAQCategoriesState,
    [PrismaStateName.faq_items]: FAQItemsState,
    [PrismaStateName.department_selection]: DepartmentSelectionState,
    [PrismaStateName.department_queue]: DepartmentQueueState,
    [PrismaStateName.department_chat]: DepartmentChatState,
    [PrismaStateName.department_queue_list]: ListDepartmentQueueState,
    [PrismaStateName.chat_with_client]: ChatWithClientState,
} as const

export class ConversationMapper {
    static toEntity(
        model: PrismaConversation & {
            client: PrismaClient | null
            employee:
                | PrismaEmployee
                | (PrismaEmployee & { department: PrismaDepartment })
                | null
            agent: PrismaEmployee | null
            company: PrismaCompany & { manager: PrismaManager }
        }
    ): Conversation {
        const companyModel = model.company
        let entity: NotDefined<Conversation> = undefined

        console.log('ConversationMapper.toEntity: model\n', model)

        if (model.userType === 'CLIENT' && model.clientId && model.client) {
            const clientModel = model.client

            entity = Conversation.create(
                {
                    user: ClientMapper.toEntity(
                        clientModel,
                        model.company,
                        model.company.manager
                    ),
                    company: CompanyMapper.toEntity(companyModel),
                },
                model.id
            )

            if (
                model.agentId &&
                model.agent &&
                model.agentType === 'EMPLOYEE'
            ) {
                entity.agent = EmployeeMapper.toEntity(
                    model.agent,
                    model.company,
                    model.company.manager
                )
            } else if (model.agentType === 'AI') {
                entity.agent = 'AI'
            }
        } else if (
            model.userType === 'EMPLOYEE' &&
            model.employeeId &&
            model.employee
        ) {
            const employeeModel = model.employee
            const departmentModel =
                'department' in employeeModel ? employeeModel.department : null
            entity = Conversation.create(
                {
                    user: EmployeeMapper.toEntity(
                        employeeModel,
                        model.company,
                        model.company.manager,
                        departmentModel
                    ),
                    company: CompanyMapper.toEntity(companyModel),
                },
                model.id
            )
        }

        if (entity) {
            let stateClass: NotDefined<ConversationState> = undefined

            switch (model.currentState) {
                case PrismaStateName.initial_menu: {
                    break
                }
                case PrismaStateName.ai_chat: {
                    stateClass = new AIChatState(entity)
                    break
                }
            }

            if (stateClass) {
                entity.transitionToState(stateClass)
            }

            return entity
        }

        throw new Error('Conversation mapping failed: User type not recognized')
    }
}
