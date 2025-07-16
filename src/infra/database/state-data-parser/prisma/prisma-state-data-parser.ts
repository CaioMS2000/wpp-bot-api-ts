import { Conversation } from '@/domain/entities/conversation'
import { StateFactory } from '@/domain/whats-app/application/factory/state-factory'
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
    Prisma,
    Conversation as PrismaConversation,
} from 'ROOT/prisma/generated'
import { z } from 'zod'

export class PrismaStateDataParser {
    constructor(private stateFactory: StateFactory) {}

    serialize(conversation: Conversation): NotDefined<Prisma.InputJsonValue> {
        switch (true) {
            case conversation.currentState instanceof AIChatState: {
                return undefined
            }
            case conversation.currentState instanceof
                DepartmentSelectionState: {
                return undefined
            }
            case conversation.currentState instanceof FAQCategoriesState: {
                return undefined
            }
            case conversation.currentState instanceof InitialMenuState: {
                return undefined
            }
            case conversation.currentState instanceof DepartmentChatState: {
                return { departmentId: conversation.currentState.departmentId }
            }
            case conversation.currentState instanceof DepartmentQueueState: {
                return { departmentId: conversation.currentState.departmentId }
            }
            case conversation.currentState instanceof ChatWithClientState: {
                return {
                    clientPhoneNumber:
                        conversation.currentState.clientPhoneNumber,
                }
            }
            case conversation.currentState instanceof
                ListDepartmentQueueState: {
                return { departmentId: conversation.currentState.departmentId }
            }
            case conversation.currentState instanceof FAQItemsState: {
                return { categoryName: conversation.currentState.categoryName }
            }
            default:
                throw new Error('Invalid state')
        }
    }

    restoreState(
        conversation: Conversation,
        prismaConversation: PrismaConversation
    ):
        | InitialMenuState
        | AIChatState
        | DepartmentChatState
        | DepartmentQueueState
        | DepartmentSelectionState
        | ChatWithClientState
        | ListDepartmentQueueState
        | FAQItemsState
        | FAQCategoriesState {
        switch (prismaConversation.currentState) {
            case 'initial_menu': {
                return this.stateFactory.create(conversation, {
                    stateName: 'InitialMenuState',
                })
            }
            case 'ai_chat': {
                return this.stateFactory.create(conversation, {
                    stateName: 'AIChatState',
                })
            }
            case 'faq_categories': {
                return this.stateFactory.create(conversation, {
                    stateName: 'FAQCategoriesState',
                })
            }
            case 'department_selection': {
                return this.stateFactory.create(conversation, {
                    stateName: 'DepartmentSelectionState',
                })
            }
        }

        if (!this.isJsonObject(prismaConversation.stateData)) {
            throw new Error('Invalid state data format')
        }

        switch (prismaConversation.currentState) {
            case 'faq_items': {
                const { categoryName } = this.validateFAQItemsStateData(
                    prismaConversation.stateData
                )
                return this.stateFactory.create(conversation, {
                    stateName: 'FAQItemsState',
                    params: { categoryName },
                })
            }
            case 'department_queue': {
                const { departmentId } = this.validateDepartmentQueueStateData(
                    prismaConversation.stateData
                )
                return this.stateFactory.create(conversation, {
                    stateName: 'DepartmentQueueState',
                    params: { departmentId },
                })
            }
            case 'department_chat': {
                const { departmentId } = this.validateDepartmentChatStateData(
                    prismaConversation.stateData
                )
                return this.stateFactory.create(conversation, {
                    stateName: 'DepartmentChatState',
                    params: { departmentId },
                })
            }
            case 'department_queue_list': {
                const { departmentId } =
                    this.validateListDepartmentQueueStateData(
                        prismaConversation.stateData
                    )
                return this.stateFactory.create(conversation, {
                    stateName: 'ListDepartmentQueueState',
                    params: { departmentId },
                })
            }
            case 'chat_with_client': {
                const { clientPhoneNumber } =
                    this.validateChatWithClientStateData(
                        prismaConversation.stateData
                    )
                return this.stateFactory.create(conversation, {
                    stateName: 'ChatWithClientState',
                    params: { clientPhoneNumber },
                })
            }
        }

        throw new Error('Invalid state')
    }
    private isJsonValue(value: unknown): value is Prisma.JsonValue {
        return (
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean' ||
            value === null ||
            this.isJsonObject(value) ||
            this.isJsonArray(value)
        )
    }

    private isJsonArray(value: unknown): value is Prisma.JsonArray {
        return Array.isArray(value) && value.every(this.isJsonValue.bind(this))
    }

    private isJsonObject(value: unknown): value is Prisma.JsonObject {
        //     return typeof value === 'object' &&
        //         value !== null &&
        //         !Array.isArray(value);
        if (
            typeof value !== 'object' ||
            value === null ||
            Array.isArray(value)
        ) {
            return false
        }

        return Object.values(value).every(this.isJsonValue)
    }

    private validateFAQItemsStateData(data: Prisma.JsonObject) {
        const schema = z.object({
            categoryName: z.string(),
        })

        return schema.parse(data)
    }

    private validateDepartmentQueueStateData(data: Prisma.JsonObject) {
        const schema = z.object({
            departmentId: z.string(),
        })

        return schema.parse(data)
    }

    private validateDepartmentChatStateData(data: Prisma.JsonObject) {
        const schema = z.object({
            departmentId: z.string(),
        })

        return schema.parse(data)
    }

    private validateListDepartmentQueueStateData(data: Prisma.JsonObject) {
        const schema = z.object({
            departmentId: z.string(),
        })

        return schema.parse(data)
    }

    private validateChatWithClientStateData(data: Prisma.JsonObject) {
        const schema = z.object({
            clientPhoneNumber: z.string(),
        })

        return schema.parse(data)
    }
}
