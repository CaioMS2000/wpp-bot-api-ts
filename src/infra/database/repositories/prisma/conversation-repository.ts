import { Client } from '@/domain/entities/client'
import { Conversation } from '@/domain/entities/conversation'
import { Employee } from '@/domain/entities/employee'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { prisma } from '@/lib/prisma'
import {
    Company as PrismaCompany,
    Conversation as PrismaConversation,
    Manager as PrismaManager,
    StateName as PrismaStateName,
} from 'ROOT/prisma/generated'
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
    private async create(
        conversation: Conversation,
        userReference: UserReferenceType,
        stateName: PrismaStateName
    ) {
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
                ...userReference,
            },
        })
    }
    private async createConversation(
        conversation: Conversation,
        userReference: UserReferenceType,
        agentType: AgentType
    ) {
        let stateName: Nullable<PrismaStateName> = null
        let stateData: unknown = null

        if (conversation.currentState instanceof InitialMenuState) {
            stateName = PrismaStateName.initial_menu
        } else if (conversation.currentState instanceof AIChatState) {
            stateName = PrismaStateName.ai_chat
        } else if (conversation.currentState instanceof FAQCategoriesState) {
            stateName = PrismaStateName.faq_categories
            stateData = conversation.currentState.categories
        } else if (conversation.currentState instanceof FAQItemsState) {
            stateName = PrismaStateName.faq_items
        } else if (
            conversation.currentState instanceof DepartmentSelectionState
        ) {
            stateName = PrismaStateName.department_selection
        } else if (conversation.currentState instanceof DepartmentQueueState) {
            stateName = PrismaStateName.department_queue
        } else if (conversation.currentState instanceof DepartmentChatState) {
            stateName = PrismaStateName.department_chat
        } else if (
            conversation.currentState instanceof ListDepartmentQueueState
        ) {
            stateName = PrismaStateName.department_queue_list
        } else if (conversation.currentState instanceof ChatWithClientState) {
            stateName = PrismaStateName.chat_with_client
        }

        if (!stateName) {
            throw new Error('Conversation state not found')
        }

        await this.create(conversation, userReference, stateName)
    }

    private async updateConversation(
        prismaConversation: PrismaConversation,
        conversation: Conversation,
        userReference: UserReferenceType,
        agentType: AgentType
    ) {}

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
            await this.updateConversation(
                existingConversation,
                conversation,
                userReferenceObject,
                agentType
            )
        } else {
            await this.createConversation(
                conversation,
                userReferenceObject,
                agentType
            )
        }
    }

    async findActiveByClientPhone(
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

        return model ? ConversationMapper.toEntity(model) : null
    }

    async findActiveByEmployeePhone(
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

        return model ? ConversationMapper.toEntity(model) : null
    }

    async findActiveByClientPhoneOrThrow(phone: string): Promise<Conversation> {
        const conversation = await this.findActiveByClientPhone(phone)

        if (!conversation) {
            throw new Error('No active conversation found for client phone')
        }

        return conversation
    }
}
