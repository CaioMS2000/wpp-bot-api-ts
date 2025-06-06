import { MenuOption, StateInfo } from '../../@types'
import { ConversationState } from './conversation-state'
import { StateTransition } from './state-transition'

export class InitialMenuState extends ConversationState {
    handleMessage(messageContent: string): StateTransition {
        // O estado apenas ANALISA a mensagem e retorna a decisão
        const normalizedMessage = messageContent.toLowerCase().trim()

        if (normalizedMessage.includes('ia') || normalizedMessage === '1') {
            return StateTransition.toAIChat()
        }

        if (normalizedMessage.includes('faq') || normalizedMessage === '3') {
            return StateTransition.toFAQCategories()
        }

        // Para departamentos, retorna uma transição que indica necessidade de validação
        if (this.isPotentialDepartmentSelection(normalizedMessage)) {
            return StateTransition.toDepartmentValidation(normalizedMessage)
        }

        return StateTransition.stayInCurrent('Opção não reconhecida')
    }

    private isPotentialDepartmentSelection(message: string): boolean {
        return (
            message === '2' ||
            message.includes('departamento') ||
            message.includes('atendimento')
        )
    }

    getMenuOptions(): MenuOption[] {
        return [
            { key: '1', label: 'Conversar com IA' },
            { key: '2', label: 'Ver Departamentos' },
            { key: '3', label: 'FAQ' },
        ]
    }

    getStateInfo(): StateInfo {
        return {
            name: 'initial_menu',
            requiresExternalData: false,
            nextPossibleStates: [
                'ai_chat',
                'department_selection',
                'faq_categories',
            ],
        }
    }
}
