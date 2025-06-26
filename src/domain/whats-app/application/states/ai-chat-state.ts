import {
    ConversationState,
    ConversationStateConfig,
    conversationStateDefaultConfig,
} from './conversation-state'
import { StateTransition } from './state-transition'

export class AIChatState extends ConversationState {
    handleMessage(messageContent: string): StateTransition {
        throw new Error('Method not implemented.')
    }
}
