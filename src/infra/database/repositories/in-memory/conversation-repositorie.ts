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
import { ConversationRepository } from '@/domain/repositories/conversation-repositorie'

export class InMemoryConversationRepository extends ConversationRepository {
    private data: Record<string, Conversation> = {}

    async findActiveByClientPhone(
        clientPhone: string
    ): Promise<Nullable<Conversation>> {
        const conversations = Object.values(this.data).filter(
            conversation =>
                conversation.client.phone === clientPhone &&
                !conversation.endedAt
        )

        return conversations.length > 0 ? conversations[0] : null
    }

    async save(conversation: Conversation): Promise<void> {
        const identifier = `${conversation.client.id}-${conversation.agent}-${dayjs(conversation.startedAt).format('hh:mm-DD-MM-YYYY')}`

        this.data[identifier] = conversation
    }
}
