import { Client } from '@/domain/entities/client'
import { Conversation } from '@/domain/entities/conversation'
import {
    ConversationState,
    ConversationStateConfig,
    conversationStateDefaultConfig,
} from '../conversation-state'
import { StateTransition } from '../state-transition'
import { logger } from '@/core/logger'

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
    handleMessage(messageContent: string): StateTransition {
        logger.debug(
            `[ChatWithClientState.handleMessage] message: ${messageContent}`
        )
        if (!this.config.outputPort) {
            throw new Error('Output port not set')
        }

        this.config.outputPort.handle(this.client, messageContent)

        return StateTransition.stayInCurrent()
    }

    get client() {
        return this.props.client
    }

    onEnter() {
        if (!this.config.outputPort) {
            throw new Error('Output port not set')
        }

        this.config.outputPort.handle(
            this.conversation.user,
            `Você está conversando com o cliente: ${this.client.name} - ${this.client.phone}`
        )
    }
}
