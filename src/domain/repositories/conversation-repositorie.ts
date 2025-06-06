import { Conversation } from '../entities/conversation'

export abstract class ConversationRepository {
    abstract findActiveByClientPhone(
        clientPhone: string
    ): Promise<Conversation | null>
    abstract save(conversation: Conversation): Promise<void>
}
