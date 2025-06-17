import { Conversation } from '@/domain/entities/conversation'
import { ConversationState } from '../states/conversation-state'

export abstract class StateCreator {
    abstract validate(data?: unknown): Voidable<any>
    abstract create(
        conversation: Conversation,
        data?: unknown
    ): ConversationState
}
