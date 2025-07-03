import { OutputPort } from '@/core/output/output-port'
import { Client } from '@/domain/entities/client'
import { Conversation } from '@/domain/entities/conversation'
import { execute } from '@caioms/ts-utils/functions'
import { TransitionIntent } from '../../factory/types'
import { ConversationState } from '../conversation-state'

type ChatWithClientStateProps = {
    client: Client
}

export class ChatWithClientState extends ConversationState<ChatWithClientStateProps> {
    constructor(
        conversation: Conversation,
        client: Client,
        outputPort: OutputPort
    ) {
        super(conversation, outputPort, { client })
    }
    async handleMessage(
        messageContent: string
    ): Promise<Nullable<TransitionIntent>> {
        await execute(this.outputPort.handle, this.client, {
            type: 'text',
            content: messageContent,
        })

        return null
    }

    get client() {
        return this.props.client
    }

    async onEnter() {
        await execute(this.outputPort.handle, this.conversation.user, {
            type: 'text',
            content: `Você está conversando com o cliente: ${this.client.name} - ${this.client.phone}`,
        })
    }
}
