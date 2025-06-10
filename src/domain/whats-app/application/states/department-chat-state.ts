import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { MenuOption } from '../../@types'
import { ConversationState } from './conversation-state'
import { StateTransition } from './state-transition'

export class DepartmentChatState extends ConversationState {
    constructor(
        conversation: Conversation,
        private department: Department
    ) {
        super(conversation)
    }

    handleMessage(messageContent: string): StateTransition {
        throw new Error('Method not implemented.')
    }

    getResponse(): string {
        return this.formatMenuOptions([
            { key: 'menu', label: 'Voltar ao menu principal' },
            { key: 'encerrar', label: 'Encerrar atendimento' },
        ])
    }
}
