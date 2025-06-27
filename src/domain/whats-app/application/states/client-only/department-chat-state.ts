import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
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

    handleMessage(messageContent: string): StateTransition {
        if (!this.config.outputPort) {
            throw new Error('Output port not set')
        }

        if (this.conversation.agent && this.conversation.agent !== 'AI') {
            this.config.outputPort.handle(
                this.conversation.agent,
                messageContent
            )
        }

        return StateTransition.stayInCurrent()
    }

    onEnter() {
        if (!this.config.outputPort) {
            throw new Error('Output port not set')
        }

        this.config.outputPort.handle(
            this.conversation.user,
            `You are now chatting with the department: ${this.department.name}`
        )
    }
}
