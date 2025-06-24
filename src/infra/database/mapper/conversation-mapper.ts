import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { Conversation } from '@/domain/entities/conversation'
import { Employee } from '@/domain/entities/employee'
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

import { logger } from '@/core/logger'
import { Department } from '@/domain/entities/department'
import {
    Client as PrismaClient,
    Company as PrismaCompany,
    Conversation as PrismaConversation,
    Employee as PrismaEmployee,
    Manager as PrismaManager,
    Department as PrismaDepartment,
    StateName as PrismaStateName,
} from 'ROOT/prisma/generated'
import { clientValidatorSchema } from '../validators/stateDataJSONValidators/clientValidator'
import { departmentValidatorSchema } from '../validators/stateDataJSONValidators/departmentValidator'
import { departmentsValidatorSchema } from '../validators/stateDataJSONValidators/departmentsValidator'
import { faqCategoriesStateDataValidatorSchema } from '../validators/stateDataJSONValidators/faqCategoriesValidator'
import { faqCategoryValidatorSchema } from '../validators/stateDataJSONValidators/faqCategoryValidator'
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
            company: PrismaCompany & { manager: PrismaManager }
        }
    ): Conversation {
        const companyModel = model.company
        let entity: NotDefined<Conversation> = undefined

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
            // logger.print(
            //     '[ConversationMapper] state in switch case\nstate and state data\n',
            //     model.currentState,
            //     '\n',
            //     model.stateData
            // )
            // let stateClass: NotDefined<ConversationState> = stateMap[model.currentState]
            let stateClass: NotDefined<ConversationState> = undefined

            switch (model.currentState) {
                case PrismaStateName.initial_menu: {
                    break
                }
                case PrismaStateName.ai_chat: {
                    stateClass = new AIChatState(entity)
                    break
                }
                // case PrismaStateName.faq_categories: {
                //     logger.info('Loading saved faq categories state')
                //     const categoriesData =
                //         faqCategoriesStateDataValidatorSchema.parse(
                //             model.stateData
                //         )

                //     stateClass = new FAQCategoriesState(entity, categoriesData)
                //     break
                // }
                // case PrismaStateName.faq_items: {
                //     logger.info('Loading saved faq items state')
                //     const { categoryName, items } =
                //         faqCategoryValidatorSchema.parse(model.stateData)
                //     stateClass = new FAQItemsState(entity, categoryName, items)
                //     break
                // }
                // case PrismaStateName.department_selection: {
                //     logger.info('Loading saved department selection state')
                //     const departmentsData = departmentsValidatorSchema.parse(
                //         model.stateData
                //     )
                //     const departments = departmentsData
                //         .map(departmentData => {
                //             const department = existingDepartments.find(
                //                 department =>
                //                     department.name === departmentData.name
                //             )
                //             if (!department) {
                //                 logger.warn(
                //                     `Failed to find ${departmentData.name} department from saved state`
                //                 )
                //                 return undefined
                //             }
                //             return department
                //         })
                //         .filter(department => department !== undefined)

                //     stateClass = new DepartmentSelectionState(
                //         entity,
                //         departments
                //     )
                //     break
                // }
                // case PrismaStateName.department_queue: {
                //     logger.info('Loading saved department queue state')
                //     const departmentData = departmentValidatorSchema.parse(
                //         model.stateData
                //     )
                //     const department = existingDepartments.find(
                //         department => department.name === departmentData.name
                //     )

                //     if (!department) {
                //         logger.warn(
                //             `Failed to load saved state. Department ${departmentData.name} not found`
                //         )
                //         break
                //     }

                //     stateClass = new DepartmentQueueState(entity, department)
                //     break
                // }
                // case PrismaStateName.department_chat: {
                //     logger.info('Loading saved department chat state')
                //     const departmentData = departmentValidatorSchema.parse(
                //         model.stateData
                //     )
                //     const department = existingDepartments.find(
                //         department => department.name === departmentData.name
                //     )

                //     if (!department) {
                //         logger.warn(
                //             `Failed to load saved state. Department ${departmentData.name} not found`
                //         )
                //         break
                //     }

                //     stateClass = new DepartmentChatState(entity, department)
                //     break
                // }
                // case PrismaStateName.department_queue_list: {
                //     logger.info('Loading saved department queue list state')
                //     const departmentData = departmentValidatorSchema.parse(
                //         model.stateData
                //     )
                //     const department = existingDepartments.find(
                //         department => department.name === departmentData.name
                //     )

                //     if (!department) {
                //         logger.warn(
                //             `Failed to load saved state. Department ${departmentData.name} not found`
                //         )
                //         break
                //     }

                //     stateClass = new ListDepartmentQueueState(
                //         entity,
                //         department
                //     )
                //     break
                // }
                // case PrismaStateName.chat_with_client: {
                //     logger.info('Loading saved chat with client state')
                //     const clientData = clientValidatorSchema.parse(
                //         model.stateData
                //     )
                //     const client = existingClients.find(
                //         client => clientData.phone === client.phone
                //     )

                //     if (!client) {
                //         logger.warn(
                //             `Failed to load saved state. Client ${clientData.phone} not found`
                //         )
                //         break
                //     }

                //     stateClass = new ChatWithClientState(entity, client)
                //     break
                // }
            }

            if (stateClass) {
                entity.transitionToState(stateClass)
            }

            return entity
        }

        throw new Error('Conversation mapping failed: User type not recognized')
    }
}
