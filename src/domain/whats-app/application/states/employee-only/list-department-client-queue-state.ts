import { logger } from '@/core/logger'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import {
    ConversationState,
    ConversationStateConfig,
    conversationStateDefaultConfig,
} from '../conversation-state'
import { StateTransition } from '../state-transition'

type ListDepartmentQueueStateProps = {
    department: Department
}

export class ListDepartmentQueueState extends ConversationState<ListDepartmentQueueStateProps> {
    constructor(
        conversation: Conversation,
        department: Department,
        config: ConversationStateConfig = conversationStateDefaultConfig
    ) {
        super(conversation, { department }, config)
    }

    get department() {
        return this.props.department
    }

    handleMessage(messageContent: string): StateTransition {
        throw new Error(
            'This state should not even last long enough to handle a message'
        )
    }

    onEnter() {
        if (!this.config.outputPort) {
            throw new Error('Output port not set')
        }

        logger.print(
            '[ListDepartmentQueueState.entryMessage] department\n',
            this.department
        )
        if (this.department.queue.length === 0) {
            this.config.outputPort.handle(this.conversation.user, 'Fila vazia')
        }

        this.config.outputPort.handle(
            this.conversation.user,
            this.department.queue.reduce((acc, client) => {
                return `${acc}${client.name} - ${client.phone}\n`
            }, 'Fila:\n')
        )
    }

    shouldAutoTransition(): boolean {
        return true
    }

    getAutoTransition(): StateTransition {
        return StateTransition.toInitialMenu()
    }
}
