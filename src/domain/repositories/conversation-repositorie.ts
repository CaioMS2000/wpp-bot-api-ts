import { Conversation } from '../entities/conversation'

export abstract class ConversationRepository {
    abstract findActiveByClientPhone(
        clientPhone: string
    ): Promise<Nullable<Conversation>>
    abstract save(conversation: Conversation): Promise<void>
}
