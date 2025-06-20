import { Client } from '@/domain/entities/client'
import { Conversation } from '@/domain/entities/conversation'
import { ConversationState } from '../conversation-state'
import { StateTransition } from '../state-transition'

export class ChatWithClientState extends ConversationState {
    constructor(
        conversation: Conversation,
        private client: Client
    ) {
        super(conversation)
    }
    handleMessage(messageContent: string): StateTransition {
        throw new Error('Method not implemented.')
    }

    get entryMessage() {
        return `Você está conversando com o cliente: ${this.client.name} - ${this.client.phone}`
    }
}
