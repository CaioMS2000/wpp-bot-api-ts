import { OutputPort } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { execute } from '@caioms/ts-utils/functions'
import { TransitionIntent } from '../../factory/types'
import { ConversationState } from '../conversation-state'
import { logger } from '@/core/logger'

type DepartmentChatStateProps = {
    department: Department
}

export class DepartmentChatState extends ConversationState<DepartmentChatStateProps> {
    constructor(
        conversation: Conversation,
        outputPort: OutputPort,
        private department: Department
    ) {
        super(conversation, outputPort, { department })
    }

    async handleMessage(
        messageContent: string
    ): Promise<Nullable<TransitionIntent>> {
        if (this.conversation.agent && this.conversation.agent !== 'AI') {
            await execute(this.outputPort.handle, this.conversation.agent, {
                type: 'text',
                content: `🔵 *[Cliente] ${this.conversation.user.name}*\n📞 *${this.conversation.user.phone}*\n\n${messageContent}`,
            })
        }

        return null
    }

    async onEnter() {
        await execute(this.outputPort.handle, this.conversation.user, {
            type: 'text',
            content: `🔔 Você está conversando com o departamento: ${this.department.name}`,
        })
    }
}
