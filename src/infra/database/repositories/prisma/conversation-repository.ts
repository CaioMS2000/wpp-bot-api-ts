import { prisma } from '@/lib/prisma'
import { Conversation } from '@/domain/entities/conversation'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { ConversationMapper } from '../../mapper/conversation-mapper'
import { Client } from '@/domain/entities/client'
import { Employee } from '@/domain/entities/employee'
import {
    Manager as PrismaManager,
    Company as PrismaCompany,
} from 'ROOT/prisma/generated'

export class PrismaConversationRepository extends ConversationRepository {
    async save(conversation: Conversation): Promise<void> {
        const user: Client | Employee = conversation.user
        let userReferenceObject: Nullable<
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
        > = null
        let agentType: Nullable<'AI' | 'EMPLOYEE'> = null

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

        await prisma.conversation.upsert({
            where: { id: conversation.id },
            update: {
                startedAt: conversation.startedAt,
                endedAt: conversation.endedAt,
                lastStateChange: conversation.lastStateChange,
                companyId: conversation.company.id,
                aiServiceThreadId: conversation.aiServiceThreadId,
                aiServiceThreadResume: conversation.aiServiceThreadResume,
                ...userReferenceObject,
            },
            create: {
                id: conversation.id,
                startedAt: conversation.startedAt,
                endedAt: conversation.endedAt,
                lastStateChange: conversation.lastStateChange,
                companyId: conversation.company.id,
                aiServiceThreadId: conversation.aiServiceThreadId,
                aiServiceThreadResume: conversation.aiServiceThreadResume,
                currentState: String(conversation.currentState),
                ...userReferenceObject,
            },
        })
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
