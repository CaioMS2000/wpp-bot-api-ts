import { Department } from '@/domain/entities/department'
import { MenuOption, StateInfo } from '../../@types'
import { StateTransition } from './state-transition'
import { Conversation } from '@/domain/entities/conversation'
import { ConversationState } from './conversation-state'

export class DepartmentChatState extends ConversationState {
    constructor(
        conversation: Conversation,
        private department: Department
    ) {
        super(conversation)
    }

    handleMessage(messageContent: string): StateTransition {
        const normalized = messageContent.toLowerCase().trim()

        // Comandos para sair do atendimento
        if (
            normalized.includes('encerrar') ||
            normalized.includes('finalizar')
        ) {
            return StateTransition.toInitialMenu()
        }

        if (normalized.includes('menu')) {
            return StateTransition.toInitialMenu()
        }

        // Para outras mensagens, mantém no estado atual
        // (aqui você implementaria a lógica de conectar com funcionário real)
        return StateTransition.stayInCurrent(
            `Sua mensagem foi enviada para ${this.department.name}. Um atendente responderá em breve.\n\nDigite 'menu' para voltar ao menu principal ou 'encerrar' para finalizar o atendimento.`
        )
    }

    getMenuOptions(): MenuOption[] {
        return [
            { key: 'menu', label: 'Voltar ao menu principal' },
            { key: 'encerrar', label: 'Encerrar atendimento' },
        ]
    }

    getStateInfo(): StateInfo {
        return {
            name: 'department_chat',
            requiresExternalData: false,
            nextPossibleStates: ['initial_menu'],
        }
    }
}
