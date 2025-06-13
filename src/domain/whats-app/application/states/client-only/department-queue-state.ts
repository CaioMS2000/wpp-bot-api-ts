import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { MenuOption } from '../../../@types'
import { ConversationState } from '../conversation-state'
import { StateTransition } from '../state-transition'

export class DepartmentQueueState extends ConversationState {
    constructor(
        conversation: Conversation,
        private department: Department
    ) {
        super(conversation)
    }

    handleMessage(messageContent: string): StateTransition {
        if (messageContent === 'sair') {
            return StateTransition.toInitialMenu()
        }

        return StateTransition.stayInCurrent()
    }

    get entryMessage() {
        return `Você está na fila de espera do ${this.department.name}, em breve um atendente entrará em contato. Caso queira sair da fila de espera, digite "sair".`
    }
}
