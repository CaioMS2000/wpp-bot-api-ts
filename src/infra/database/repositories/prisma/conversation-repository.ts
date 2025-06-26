import { logger } from '@/core/logger'
import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { Conversation } from '@/domain/entities/conversation'
import { Employee } from '@/domain/entities/employee'
import { FAQItem } from '@/domain/entities/faq'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { AIChatState } from '@/domain/whats-app/application/states/ai-chat-state'
import { DepartmentChatState } from '@/domain/whats-app/application/states/client-only/department-chat-state'
import { DepartmentQueueState } from '@/domain/whats-app/application/states/client-only/department-queue-state'
import { DepartmentSelectionState } from '@/domain/whats-app/application/states/client-only/department-selection-state'
import { ChatWithClientState } from '@/domain/whats-app/application/states/employee-only/chat-with-client-sate'
import { ListDepartmentQueueState } from '@/domain/whats-app/application/states/employee-only/list-department-client-queue-state'
import { FAQCategoriesState } from '@/domain/whats-app/application/states/faq-categories-state'
import { FAQItemsState } from '@/domain/whats-app/application/states/faq-items-state'
import { InitialMenuState } from '@/domain/whats-app/application/states/initial-menu-state'
import { prisma } from '@/lib/prisma'
import { Prisma } from 'ROOT/prisma/generated'
import {
    Conversation as PrismaConversation,
    Employee as PrismaEmployee,
    StateName as PrismaStateName,
} from 'ROOT/prisma/generated'
import { ClientMapper } from '../../mapper/client-mapper'
import { ConversationMapper } from '../../mapper/conversation-mapper'
import { DepartmentMapper } from '../../mapper/department-mapper'
import { clientValidatorSchema } from '../../validators/stateDataJSONValidators/clientValidator'
import { departmentValidatorSchema } from '../../validators/stateDataJSONValidators/departmentValidator'
import { departmentsValidatorSchema } from '../../validators/stateDataJSONValidators/departmentsValidator'
import { faqCategoriesStateDataValidatorSchema } from '../../validators/stateDataJSONValidators/faqCategoriesValidator'
import { faqCategoryValidatorSchema } from '../../validators/stateDataJSONValidators/faqCategoryValidator'

const stateMap = {
    [InitialMenuState.name]: PrismaStateName.initial_menu,
    [AIChatState.name]: PrismaStateName.ai_chat,
    [FAQCategoriesState.name]: PrismaStateName.faq_categories,
    [FAQItemsState.name]: PrismaStateName.faq_items,
    [DepartmentSelectionState.name]: PrismaStateName.department_selection,
    [DepartmentQueueState.name]: PrismaStateName.department_queue,
    [DepartmentChatState.name]: PrismaStateName.department_chat,
    [ListDepartmentQueueState.name]: PrismaStateName.department_queue_list,
    [ChatWithClientState.name]: PrismaStateName.chat_with_client,
} as const

type UserReferenceType =
    | {
          clientId: string
          userType: 'CLIENT' | 'EMPLOYEE'
          agentType: Nullable<'AI' | 'EMPLOYEE'>
      }
    | {
          employeeId: string
          userType: 'CLIENT' | 'EMPLOYEE'
          agentType: Nullable<'AI' | 'EMPLOYEE'>
      }

type AgentType = Nullable<'AI' | 'EMPLOYEE'>

export class PrismaConversationRepository extends ConversationRepository {
    private serializeStateData(
        conversation: Conversation
    ): NotDefined<Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue> {
        if (conversation.currentState instanceof InitialMenuState) {
            // sem dados
        } else if (conversation.currentState instanceof AIChatState) {
            // sem dados
        } else if (conversation.currentState instanceof FAQCategoriesState) {
            const { categories } = conversation.currentState.data
            const data = categories.reduce(
                (acc, cat) => {
                    acc[cat.name] = cat.items
                    return acc
                },
                {} as Record<string, FAQItem[]>
            )

            return data
        } else if (conversation.currentState instanceof FAQItemsState) {
            const { categoryName, items } = conversation.currentState.data
            const data = { [categoryName]: items }

            return data
        } else if (
            conversation.currentState instanceof DepartmentSelectionState
        ) {
            const { departments } = conversation.currentState.data
            const data = { departments: departments.map(dept => dept.name) }

            return data
        } else if (conversation.currentState instanceof DepartmentQueueState) {
            const { department } = conversation.currentState.data
            const data = { name: department.name }

            return data
        } else if (conversation.currentState instanceof DepartmentChatState) {
            const { department } = conversation.currentState.data
            const data = { name: department.name }

            return data
        } else if (
            conversation.currentState instanceof ListDepartmentQueueState
        ) {
            const { department } = conversation.currentState.data
            const data = { name: department.name }

            return data
        } else if (conversation.currentState instanceof ChatWithClientState) {
            const { client } = conversation.currentState.data
            const data = { phone: client.phone }

            return data
        }

        return undefined
    }

    private async restoreSate(entity: Conversation, model: PrismaConversation) {
        switch (model.currentState) {
            case PrismaStateName.initial_menu: {
                const state = new InitialMenuState(entity)

                return state
            }
            case PrismaStateName.ai_chat: {
                const state = new AIChatState(entity)

                return state
            }
            case PrismaStateName.faq_categories: {
                const data = faqCategoriesStateDataValidatorSchema.parse(
                    model.stateData
                )
                const state = new FAQCategoriesState(
                    entity,
                    Object.entries(data).map(([key, value]) => {
                        return { name: key, items: value }
                    })
                )

                return state
            }
            case PrismaStateName.faq_items: {
                const data = faqCategoryValidatorSchema.parse(model.stateData)

                const [categoryName, items] = Object.entries(data)[0]
                const state = new FAQItemsState(entity, categoryName, items)

                return state
            }
            case PrismaStateName.department_selection: {
                const data = departmentsValidatorSchema.parse(model.stateData)
                const recoveredDepartments = await Promise.all(
                    data.departments.map(dep =>
                        prisma.department.findFirst({
                            where: { name: dep },
                            include: {
                                company: { include: { manager: true } },
                                queue: true,
                                employees: true,
                            },
                        })
                    )
                ).then(results =>
                    results.filter(
                        (dept): dept is NonNullable<typeof dept> =>
                            dept !== null
                    )
                )
                const state = new DepartmentSelectionState(
                    entity,
                    recoveredDepartments.map(DepartmentMapper.toEntity)
                )

                return state
            }
            case PrismaStateName.department_queue: {
                const data = departmentValidatorSchema.parse(model.stateData)
                const department = await prisma.department.findFirstOrThrow({
                    where: { name: data.name },
                    include: {
                        company: { include: { manager: true } },
                        queue: true,
                        employees: true,
                    },
                })
                const state = new DepartmentQueueState(
                    entity,
                    DepartmentMapper.toEntity(department)
                )

                return state
            }
            case PrismaStateName.department_chat: {
                const data = departmentValidatorSchema.parse(model.stateData)
                const department = await prisma.department.findFirstOrThrow({
                    where: { name: data.name },
                    include: {
                        company: { include: { manager: true } },
                        queue: true,
                        employees: true,
                    },
                })
                const state = new DepartmentChatState(
                    entity,
                    DepartmentMapper.toEntity(department)
                )

                return state
            }
            case PrismaStateName.department_queue_list: {
                const data = departmentValidatorSchema.parse(model.stateData)
                const department = await prisma.department.findFirstOrThrow({
                    where: { name: data.name },
                    include: {
                        company: { include: { manager: true } },
                        queue: true,
                        employees: true,
                    },
                })
                const state = new ListDepartmentQueueState(
                    entity,
                    DepartmentMapper.toEntity(department)
                )

                return state
            }
            case PrismaStateName.chat_with_client: {
                const data = clientValidatorSchema.parse(model.stateData)
                const client = await prisma.client.findUniqueOrThrow({
                    where: { phone: data.phone },
                    include: { company: { include: { manager: true } } },
                })
                const state = new ChatWithClientState(
                    entity,
                    ClientMapper.toEntity(
                        client,
                        client.company,
                        client.company.manager
                    )
                )

                return state
            }
        }
    }

    private async createConversation(
        conversation: Conversation,
        userReference: UserReferenceType
    ) {
        const stateName = stateMap[conversation.currentState.constructor.name]
        const stateData = conversation.currentState.data

        await prisma.conversation.create({
            data: {
                id: conversation.id,
                startedAt: conversation.startedAt,
                endedAt: conversation.endedAt,
                lastStateChange: conversation.lastStateChange,
                companyId: conversation.company.id,
                aiServiceThreadId: conversation.aiServiceThreadId,
                aiServiceThreadResume: conversation.aiServiceThreadResume,
                currentState: stateName,
                stateData: this.serializeStateData(conversation),
                ...userReference,
            },
        })
    }

    private async updateConversation(
        conversation: Conversation,
        userReference: UserReferenceType
    ) {
        const stateName = stateMap[conversation.currentState.constructor.name]
        const serializedStateData = this.serializeStateData(conversation)
        let possibleEmployeeAgent: Nullable<PrismaEmployee> = null
        let agentId: Nullable<string> = null

        if (
            userReference.agentType === 'EMPLOYEE' &&
            conversation.agent &&
            conversation.agent !== 'AI'
        ) {
            possibleEmployeeAgent = await prisma.employee.findUniqueOrThrow({
                where: {
                    id: conversation.agent.id,
                },
            })

            agentId = possibleEmployeeAgent.id
        }

        await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                startedAt: conversation.startedAt,
                endedAt: conversation.endedAt,
                lastStateChange: conversation.lastStateChange,
                companyId: conversation.company.id,
                aiServiceThreadId: conversation.aiServiceThreadId,
                aiServiceThreadResume: conversation.aiServiceThreadResume,
                currentState: stateName,
                stateData: serializedStateData,
                agentId,
                ...userReference,
            },
        })
    }

    async save(conversation: Conversation): Promise<void> {
        const user: Client | Employee = conversation.user
        let userReferenceObject: Nullable<UserReferenceType> = null
        let agentType: AgentType = null

        if (conversation.agent === 'AI') {
            agentType = 'AI'
        } else if (conversation.agent) {
            agentType = 'EMPLOYEE'
        }

        if (user instanceof Client) {
            userReferenceObject = {
                clientId: user.id,
                userType: 'CLIENT',
                agentType,
            }
        } else if (user instanceof Employee) {
            userReferenceObject = {
                employeeId: user.id,
                userType: 'EMPLOYEE',
                agentType,
            }
        }

        if (!userReferenceObject) {
            throw new Error(
                '[PrismaConversationRepository.save] User type not recognized'
            )
        }

        const existingConversation = await prisma.conversation.findUnique({
            where: { id: conversation.id },
        })

        if (existingConversation) {
            return await this.updateConversation(
                conversation,
                userReferenceObject
            )
        }

        return await this.createConversation(conversation, userReferenceObject)
    }

    async findActiveByClientPhone(
        company: Company,
        phone: string
    ): Promise<Nullable<Conversation>> {
        const model = await prisma.conversation.findFirst({
            where: {
                client: {
                    phone,
                    companyId: company.id,
                },
                endedAt: null,
            },
            include: {
                client: { include: { company: true } },
                agent: true,
                employee: {
                    include: { department: { include: { queue: true } } },
                },
                company: { include: { manager: true } },
            },
        })

        const result = model ? ConversationMapper.toEntity(model) : null

        if (result && model) {
            const restoredSate = await this.restoreSate(result, model)

            if (restoredSate) {
                result.currentState = restoredSate
            }
        }

        return result
    }

    async findActiveByEmployeePhone(
        company: Company,
        phone: string
    ): Promise<Nullable<Conversation>> {
        const model = await prisma.conversation.findFirst({
            where: {
                employee: {
                    phone,
                    companyId: company.id,
                },
                endedAt: null,
            },
            include: {
                client: true,
                agent: true,
                employee: { include: { company: true, department: true } },
                company: { include: { manager: true } },
            },
        })

        const result = model ? ConversationMapper.toEntity(model) : null

        if (result && model) {
            const restoredSate = await this.restoreSate(result, model)

            if (restoredSate) {
                result.currentState = restoredSate
            }
        }

        return result
    }

    async findActiveByClientPhoneOrThrow(
        company: Company,
        phone: string
    ): Promise<Conversation> {
        const conversation = await this.findActiveByClientPhone(company, phone)

        if (!conversation) {
            throw new Error('No active conversation found for client phone')
        }

        return conversation
    }
}
