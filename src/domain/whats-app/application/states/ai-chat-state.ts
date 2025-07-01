import {
    ConversationState,
    ConversationStateConfig,
    conversationStateDefaultConfig,
} from './conversation-state'
import { StateTransition } from './state-transition'

export class AIChatState extends ConversationState {
    async handleMessage(messageContent: string): Promise<StateTransition> {
        throw new Error('Method not implemented.')
    }
}
