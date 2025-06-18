import dayjs from 'dayjs'
import 'dayjs/locale/pt-br' // importa o locale português do Brasil
import localizedFormat from 'dayjs/plugin/localizedFormat'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(localizedFormat)
dayjs.locale('pt-br')
import { Conversation } from '@/domain/entities/conversation'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { logger } from '@/core/logger'

export class InMemoryConversationRepository extends ConversationRepository {
    private data: Record<string, Conversation> = {}

    async save(conversation: Conversation): Promise<void> {
        this.data[conversation.id] = conversation
        logger.print(
            `InMemoryConversationRepository - save - now we have total of: ${Object.values(this.data).length} conversations`,
            this.data
        )
    }

    async findActiveByClientPhone(
        clientPhone: string
    ): Promise<Nullable<Conversation>> {
        const conversations = Object.values(this.data).filter(conversation => {
            logger.print(`this one exixts: ${conversation}`)
            return (
                conversation.user.phone === clientPhone && !conversation.endedAt
            )
        })

        logger.print(
            `InMemoryConversationRepository - findActiveByClientPhone: ${clientPhone}\nConversations found: ${conversations.length}`,
            conversations
        )

        return conversations.length > 0 ? conversations[0] : null
    }

    async findActiveByEmployeePhone(
        employeePhone: string
    ): Promise<Nullable<Conversation>> {
        const conversations = Object.values(this.data).filter(
            conversation =>
                conversation.agent === employeePhone && !conversation.endedAt
        )
        return conversations.length > 0 ? conversations[0] : null
    }

    async findActiveByClientPhoneOrThrow(
        clientPhone: string
    ): Promise<Conversation> {
        const conversations = Object.values(this.data).filter(
            conversation =>
                conversation.user.phone === clientPhone && !conversation.endedAt
        )
        const conversation = conversations.shift()

        if (!conversation) {
            throw new Error('No active conversation found for client phone')
        }

        return conversation
    }
}
