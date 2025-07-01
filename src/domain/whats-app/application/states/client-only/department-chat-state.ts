import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { execute } from '@caioms/ts-utils/functions'
import {
    ConversationState,
    ConversationStateConfig,
    conversationStateDefaultConfig,
} from '../conversation-state'
import { StateTransition } from '../state-transition'

type DepartmentChatStateProps = {
    department: Department
}

export class DepartmentChatState extends ConversationState<DepartmentChatStateProps> {
    constructor(
        conversation: Conversation,
        private department: Department,
        config: ConversationStateConfig = conversationStateDefaultConfig
    ) {
        super(conversation, { department }, config)
    }

    async handleMessage(messageContent: string): Promise<StateTransition> {
        if (!this.config.outputPort) {
            throw new Error('Output port not set')
        }

        if (this.conversation.agent && this.conversation.agent !== 'AI') {
            await execute(
                this.config.outputPort.handle,
                this.conversation.agent,
                {
                    type: 'text',
                    content: messageContent,
                }
            )
        }

        return StateTransition.stayInCurrent()
    }

    async onEnter() {
        if (!this.config.outputPort) {
            throw new Error('Output port not set')
        }

        await execute(this.config.outputPort.handle, this.conversation.user, {
            type: 'text',
            content: `You are now chatting with the department: ${this.department.name}`,
        })
    }
}
