// src/infra/database/mappers/message-mapper.ts
import {
    Message as PrismaMessage,
    FromType as PrismaFromType,
} from 'ROOT/prisma/generated'
import { Message } from '@/domain/entities/message'
import { Conversation } from '@/domain/entities/conversation'
import { Client } from '@/domain/entities/client'
import { Employee } from '@/domain/entities/employee'

export class MessageMapper {
    static toEntity(raw: PrismaMessage): Message {
        // Nota: Esta implementação assume que conversation, client e employee
        // serão carregados separadamente devido às dependências circulares
        return Message.create(
            {
                conversation: null as any, // Será injetado pelo repositório
                from: raw.from.toLowerCase() as 'client' | 'employee' | 'AI',
                content: raw.content,
                sender: null, // Será injetado pelo repositório
            },
            raw.id
        )
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
            from: entity.from.toUpperCase() as PrismaFromType,
            timestamp: entity.timestamp,
            conversationId: entity.conversation.id,
            aiResponseId: entity.aiResponseId,
            clientId,
            employeeId,
        }
    }
}
