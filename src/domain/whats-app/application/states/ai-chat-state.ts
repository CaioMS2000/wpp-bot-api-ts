import { ConversationState } from './conversation-state'
import { StateTransition } from './state-transition'

export class AIChatState extends ConversationState {
    handleMessage(messageContent: string): StateTransition {
        throw new Error('Method not implemented.')
    }

    get entryMessage() {
        return null
    }
}
