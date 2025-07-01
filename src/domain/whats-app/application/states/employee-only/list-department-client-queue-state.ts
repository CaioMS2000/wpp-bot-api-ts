import { logger } from '@/core/logger'
import { OutputMessage } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { execute } from '@caioms/ts-utils/functions'
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

    async handleMessage(messageContent: string): Promise<StateTransition> {
        throw new Error(
            'This state should not even last long enough to handle a message'
        )
    }

    async onEnter() {
        if (!this.config.outputPort) {
            throw new Error('Output port not set')
        }

        if (this.department.queue.length === 0) {
            await execute(
                this.config.outputPort.handle,
                this.conversation.user,
                {
                    type: 'text',
                    content: 'Fila vazia',
                }
            )
        }

        const textOutput: OutputMessage = {
            type: 'text',
            content: this.department.queue.reduce((acc, client) => {
                return `${acc}${client.name} - ${client.phone}\n`
            }, 'Fila:\n'),
        }

        await execute(
            this.config.outputPort.handle,
            this.conversation.user,
            textOutput
        )
    }

    shouldAutoTransition(): boolean {
        return true
    }

    getAutoTransition(): StateTransition {
        return StateTransition.toInitialMenu()
    }
}
