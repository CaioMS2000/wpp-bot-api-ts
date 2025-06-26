import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import {
    ConversationState,
    ConversationStateConfig,
    conversationStateDefaultConfig,
} from '../conversation-state'
import { StateTransition } from '../state-transition'

type DepartmentQueueStateProps = {
    department: Department
}

export class DepartmentQueueState extends ConversationState<DepartmentQueueStateProps> {
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
        if (messageContent === 'sair') {
            return StateTransition.toInitialMenu()
        }

        return StateTransition.stayInCurrent()
    }

    onEnter() {
        if (!this.config.outputPort) {
            throw new Error('Output port not set')
        }

        this.config.outputPort.handle(
            this.conversation.user,
            `Você está na fila de espera do ${this.department.name}, em breve um atendente entrará em contato. Caso queira sair da fila de espera, digite "sair".`
        )
    }
}
