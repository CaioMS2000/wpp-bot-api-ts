import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import {
    ConversationState,
    ConversationStateConfig,
    conversationStateDefaultConfig,
} from '../conversation-state'
import { StateTransition } from '../state-transition'
import { execute } from '@caioms/ts-utils/functions'

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

    async handleMessage(messageContent: string): Promise<StateTransition> {
        if (messageContent === 'sair') {
            return StateTransition.toInitialMenu()
        }

        return StateTransition.stayInCurrent()
    }

    async onEnter() {
        if (!this.config.outputPort) {
            throw new Error('Output port not set')
        }

        await execute(this.config.outputPort.handle, this.conversation.user, {
            type: 'text',
            content: `Você está na fila de espera do ${this.department.name}, em breve um atendente entrará em contato. Caso queira sair da fila de espera, digite "sair".`,
        })
    }
}
