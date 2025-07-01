import { logger } from '@/core/logger'
import { Client } from '@/domain/entities/client'
import { Conversation } from '@/domain/entities/conversation'
import {
    ConversationState,
    ConversationStateConfig,
    conversationStateDefaultConfig,
} from '../conversation-state'
import { StateTransition } from '../state-transition'
import { execute } from '@caioms/ts-utils/functions'

type ChatWithClientStateProps = {
    client: Client
}

export class ChatWithClientState extends ConversationState<ChatWithClientStateProps> {
    constructor(
        conversation: Conversation,
        client: Client,
        config: ConversationStateConfig = conversationStateDefaultConfig
    ) {
        super(conversation, { client }, config)
    }
    async handleMessage(messageContent: string): Promise<StateTransition> {
        if (!this.config.outputPort) {
            throw new Error('Output port not set')
        }

        await execute(this.config.outputPort.handle, this.client, {
            type: 'text',
            content: messageContent,
        })

        return StateTransition.stayInCurrent()
    }

    get client() {
        return this.props.client
    }

    async onEnter() {
        if (!this.config.outputPort) {
            throw new Error('Output port not set')
        }

        await execute(this.config.outputPort.handle, this.conversation.user, {
            type: 'text',
            content: `Você está conversando com o cliente: ${this.client.name} - ${this.client.phone}`,
        })
    }
}
