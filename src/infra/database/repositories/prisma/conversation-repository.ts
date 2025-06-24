// import { NullableJsonNullValueInput, InputJsonValue } from 'ROOT/prisma/generated'
import { Prisma } from 'ROOT/prisma/generated'
import { Client } from '@/domain/entities/client'
import { Conversation } from '@/domain/entities/conversation'
import { Employee } from '@/domain/entities/employee'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { prisma } from '@/lib/prisma'
import { StateName as PrismaStateName } from 'ROOT/prisma/generated'
import { ConversationMapper } from '../../mapper/conversation-mapper'
import { InitialMenuState } from '@/domain/whats-app/application/states/initial-menu-state'
import { AIChatState } from '@/domain/whats-app/application/states/ai-chat-state'
import { FAQCategoriesState } from '@/domain/whats-app/application/states/faq-categories-state'
import { FAQItemsState } from '@/domain/whats-app/application/states/faq-items-state'
import { DepartmentSelectionState } from '@/domain/whats-app/application/states/client-only/department-selection-state'
import { DepartmentQueueState } from '@/domain/whats-app/application/states/client-only/department-queue-state'
import { DepartmentChatState } from '@/domain/whats-app/application/states/client-only/department-chat-state'
import { ListDepartmentQueueState } from '@/domain/whats-app/application/states/employee-only/list-department-client-queue-state'
import { ChatWithClientState } from '@/domain/whats-app/application/states/employee-only/chat-with-client-sate'
import { Company } from '@/domain/entities/company'
import { DepartmentMapper } from '../../mapper/department-mapper'
import { ClientMapper } from '../../mapper/client-mapper'
import { logger } from '@/core/logger'
import { FAQItem } from '@/domain/entities/faq'

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

            logger.print('FAQCategoriesState - serialized state data', data)

            return data
        } else if (conversation.currentState instanceof FAQItemsState) {
            const { categoryName, items } = conversation.currentState.data
            const data = { [categoryName]: items }

            logger.print('FAQItemsState - serialized state data', data)

            return data
        } else if (
            conversation.currentState instanceof DepartmentSelectionState
        ) {
            const { departments } = conversation.currentState.data
            const data = { departments: departments.map(dept => dept.name) }

            logger.print(
                'DepartmentSelectionState - serialized state data',
                data
            )

            return data
        } else if (conversation.currentState instanceof DepartmentQueueState) {
            const { department } = conversation.currentState.data
            const data = { name: department.name }

            logger.print('DepartmentQueueState - serialized state data', data)

            return data
        } else if (conversation.currentState instanceof DepartmentChatState) {
            const { department } = conversation.currentState.data
            const data = { name: department.name }

            logger.print('DepartmentChatState - serialized state data', data)

            return data
        } else if (
            conversation.currentState instanceof ListDepartmentQueueState
        ) {
            const { department } = conversation.currentState.data
            const data = { name: department.name }

            logger.print(
                'ListDepartmentQueueState - serialized state data',
                data
            )

            return data
        } else if (conversation.currentState instanceof ChatWithClientState) {
            const { client } = conversation.currentState.data
            const data = { phone: client.phone }

            logger.print('ChatWithClientState - serialized state data', data)

            return data
        }

        return undefined
        // throw new Error('Invalid state')
    }

    private async createConversation(
        conversation: Conversation,
        userReference: UserReferenceType
    ) {
        const stateName = stateMap[conversation.currentState.constructor.name]
        const stateData = conversation.currentState.data

        logger.debug(
            `Creating conversation stateName:${stateName} | stateData:${stateData}`
        )

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
        const stateData = conversation.currentState.data

        logger.debug(
            `Updating conversation stateName: ${stateName} | stateData: ${JSON.stringify(stateData, null, 2)}`
        )

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
                stateData: this.serializeStateData(conversation),
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
                },
                endedAt: null,
            },
            include: {
                client: { include: { company: true } },
                agent: true,
                employee: true,
                company: { include: { manager: true } },
            },
        })

        const prismaDepartments = await prisma.department.findMany({
            where: {
                company: {
                    cnpj: company.cnpj,
                },
            },
            include: {
                company: {
                    include: {
                        manager: true,
                    },
                },
                queue: true,
                employees: true,
            },
        })
        const prismaClients = await prisma.client.findMany({
            where: {
                company: {
                    cnpj: company.cnpj,
                },
            },
            include: {
                company: {
                    include: {
                        manager: true,
                    },
                },
            },
        })

        return model
            ? ConversationMapper.toEntity(
                  model,
                  prismaDepartments.map(DepartmentMapper.toEntity),
                  prismaClients.map(client =>
                      ClientMapper.toEntity(
                          client,
                          client.company,
                          client.company.manager
                      )
                  )
              )
            : null
    }

    async findActiveByEmployeePhone(
        company: Company,
        phone: string
    ): Promise<Nullable<Conversation>> {
        const model = await prisma.conversation.findFirst({
            where: {
                agent: {
                    phone,
                },
                endedAt: null,
            },
            include: {
                client: { include: { company: true } },
                agent: true,
                employee: true,
                company: { include: { manager: true } },
            },
        })

        const prismaDepartments = await prisma.department.findMany({
            where: {
                company: {
                    cnpj: company.cnpj,
                },
            },
            include: {
                company: {
                    include: {
                        manager: true,
                    },
                },
                queue: true,
                employees: true,
            },
        })
        const prismaClients = await prisma.client.findMany({
            where: {
                company: {
                    cnpj: company.cnpj,
                },
            },
            include: {
                company: {
                    include: {
                        manager: true,
                    },
                },
            },
        })

        return model
            ? ConversationMapper.toEntity(
                  model,
                  prismaDepartments.map(DepartmentMapper.toEntity),
                  prismaClients.map(client =>
                      ClientMapper.toEntity(
                          client,
                          client.company,
                          client.company.manager
                      )
                  )
              )
            : null
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
