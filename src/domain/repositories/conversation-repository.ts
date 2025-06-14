import { Conversation } from '../entities/conversation'

export abstract class ConversationRepository {
    abstract save(conversation: Conversation): Promise<void>
    abstract findActiveByClientPhone(
        clientPhone: string
    ): Promise<Nullable<Conversation>>
    abstract findActiveByEmployeePhone(
        clientPhone: string
    ): Promise<Nullable<Conversation>>
}
