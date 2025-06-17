import { Conversation } from '@/domain/entities/conversation'
import { ConversationState } from '../states/conversation-state'
import { StateCreator } from './state-creator'
import { logger } from '@/core/logger'
import { AIChatState } from '../states/ai-chat-state'

export class AIChatStateCreator implements StateCreator {
    validate(data?: unknown) {
        logger.warn(
            'AIChatState does not require validation, but this method is called for consistency.'
        )
    }
    create(conversation: Conversation, data?: unknown): ConversationState {
        this.validate(data)

        return new AIChatState(conversation)
    }
}
