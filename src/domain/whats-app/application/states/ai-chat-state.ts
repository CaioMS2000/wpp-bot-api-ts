import { TransitionIntent } from '../factory/types'
import { ConversationState } from './conversation-state'

export class AIChatState extends ConversationState {
    async handleMessage(
        messageContent: string
    ): Promise<Nullable<TransitionIntent>> {
        throw new Error('Method not implemented.')
    }
}
