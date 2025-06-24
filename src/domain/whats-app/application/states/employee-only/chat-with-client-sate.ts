import { Client } from '@/domain/entities/client'
import { Conversation } from '@/domain/entities/conversation'
import { ConversationState } from '../conversation-state'
import { StateTransition } from '../state-transition'

type ChatWithClientStateProps = {
    client: Client
}

export class ChatWithClientState extends ConversationState<ChatWithClientStateProps> {
    constructor(conversation: Conversation, client: Client) {
        super(conversation, { client })
    }
    handleMessage(messageContent: string): StateTransition {
        throw new Error('Method not implemented.')
    }

    get client() {
        return this.props.client
    }

    get entryMessage() {
        return `Você está conversando com o cliente: ${this.client.name} - ${this.client.phone}`
    }
}
