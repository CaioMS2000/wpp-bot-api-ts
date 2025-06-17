import { Conversation } from '@/domain/entities/conversation'
import { ConversationState } from '../states/conversation-state'
import { StateCreator } from './state-creator'
import { logger } from '@/core/logger'
import { InitialMenuState } from '../states/initial-menu-state'

export class InitialMenuStateCreator implements StateCreator {
    validate(data?: unknown) {
        logger.warn(
            'InitialMenuState does not require validation, but this method is called for consistency.'
        )
    }
    create(conversation: Conversation, data?: unknown): ConversationState {
        return new InitialMenuState(conversation)
    }
}
