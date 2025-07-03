import { OutputMessage, OutputPort } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { execute } from '@caioms/ts-utils/functions'
import { TransitionIntent } from '../../factory/types'
import { ConversationState } from '../conversation-state'

type ListDepartmentQueueStateProps = {
    department: Department
}

export class ListDepartmentQueueState extends ConversationState<ListDepartmentQueueStateProps> {
    constructor(
        conversation: Conversation,
        outputPort: OutputPort,
        department: Department
    ) {
        super(conversation, outputPort, { department })
    }

    get department() {
        return this.props.department
    }

    async handleMessage(
        messageContent: string
    ): Promise<Nullable<TransitionIntent>> {
        throw new Error(
            'This state should not even last long enough to handle a message'
        )
    }

    async onEnter() {
        if (this.department.queue.length === 0) {
            return await execute(
                this.outputPort.handle,
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
            this.outputPort.handle,
            this.conversation.user,
            textOutput
        )
    }

    async getNextState(message = ''): Promise<Nullable<TransitionIntent>> {
        return { target: 'initial_menu' }
    }
}
