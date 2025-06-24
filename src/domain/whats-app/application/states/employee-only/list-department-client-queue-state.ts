import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { ConversationState } from '../conversation-state'
import { StateTransition } from '../state-transition'

type ListDepartmentQueueStateProps = {
    department: Department
}

export class ListDepartmentQueueState extends ConversationState<ListDepartmentQueueStateProps> {
    constructor(conversation: Conversation, department: Department) {
        super(conversation, { department })
    }

    get department() {
        return this.props.department
    }

    handleMessage(messageContent: string): StateTransition {
        throw new Error(
            'This state should not even last long enough to handle a message'
        )
    }

    get entryMessage() {
        if (this.department.queue.length === 0) {
            return 'Fila vazia'
        }

        return this.department.queue.reduce((acc, client) => {
            return `${acc}${client.name} - ${client.phone}\n`
        }, 'Fila:\n')
    }

    shouldAutoTransition(): boolean {
        return true
    }

    getAutoTransition(): StateTransition {
        return StateTransition.toInitialMenu()
    }
}
