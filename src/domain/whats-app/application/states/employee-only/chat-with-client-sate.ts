import { OutputPort } from '@/core/output/output-port'
import { Client } from '@/domain/entities/client'
import { Conversation } from '@/domain/entities/conversation'
import { execute } from '@caioms/ts-utils/functions'
import { TransitionIntent } from '../../factory/types'
import { ConversationState } from '../conversation-state'
import { isEmployee } from '@/utils/entity'

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
        if (!isEmployee(this.conversation.user)) {
            throw new Error('Conversation user is not an employee')
        }

        if (!this.conversation.user.department) {
            throw new Error('Employee does not have a department')
        }

        await execute(this.outputPort.handle, this.client, {
            type: 'text',
            content: `🔵 *[Funcionário] ${this.conversation.user.name}*\n🚩 *${this.conversation.user.department.name}*\n\n${messageContent}`,
        })

        return null
    }

    get client() {
        return this.props.client
    }

    async onEnter() {
        await execute(this.outputPort.handle, this.conversation.user, {
            type: 'text',
            content: `🔔 Você está conversando com o cliente *${this.client.name}*\n📞 *${this.client.phone}*`,
        })
    }
}
