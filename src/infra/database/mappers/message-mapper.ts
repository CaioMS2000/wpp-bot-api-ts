import { Message as PrismaMessage } from 'ROOT/prisma/generated'
import { Message } from '@/domain/entities/message'
import { fromDomainToPrisma } from '../utils/enumTypeMapping'

export class MessageMapper {
    static toEntity(raw: PrismaMessage): Message {
        if (raw.from === 'AI' && raw.aiResponseId) {
            return Message.create(
                {
                    conversationId: raw.conversationId,
                    from: 'AI',
                    content: raw.content,
                    aiResponseId: raw.aiResponseId,
                },
                raw.id
            )
        } else if (raw.from !== 'AI' && (raw.clientId || raw.employeeId)) {
            let resolvedFrom: Nullable<Message['from']> = null
            let resolvedSenderId: Nullable<Message['senderId']> = null

            if (raw.from === 'CLIENT') {
                resolvedFrom = 'client'
                resolvedSenderId = raw.clientId
            } else if (raw.from === 'EMPLOYEE') {
                resolvedFrom = 'employee'
                resolvedSenderId = raw.employeeId
            }

            if (!resolvedFrom || !resolvedSenderId) {
                throw new Error('Cannot resolve message origin')
            }

            return Message.create(
                {
                    from: resolvedFrom,
                    content: raw.content,
                    senderId: resolvedSenderId,
                    conversationId: raw.conversationId,
                },
                raw.id
            )
        }
        throw new Error('Cannot resolve message from')
    }

    static toModel(entity: Message): Omit<PrismaMessage, 'id'> {
        let clientId: string | null = null
        let employeeId: string | null = null

        if (entity.sender) {
            if ('email' in entity.sender) {
                // É um Employee
                employeeId = entity.sender.id
            } else {
                // É um Client
                clientId = entity.sender.id
            }
        }

        return {
            content: entity.content,
            from: fromDomainToPrisma(entity.from),
            timestamp: entity.timestamp,
            conversationId: entity.conversation.id,
            aiResponseId: entity.aiResponseId,
            clientId,
            employeeId,
        }
    }
}
