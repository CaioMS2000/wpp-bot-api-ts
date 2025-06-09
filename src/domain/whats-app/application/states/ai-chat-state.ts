import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { MenuOption, StateInfo } from '../../@types'
import { ConversationState } from './conversation-state'
import { StateTransition } from './state-transition'

export class AIChatState extends ConversationState {
    constructor(
        conversation: Conversation,
        private departments: Department[]
    ) {
        super(conversation)
    }

    handleMessage(messageContent: string): StateTransition {
        const selectedDepartment = this.findDepartmentByMessage(messageContent)

        if (selectedDepartment) {
            return StateTransition.toDepartmentChat(selectedDepartment.name)
        }

        return StateTransition.stayInCurrent('Departamento não encontrado')
    }

    private findDepartmentByMessage(message: string): Nullable<Department> {
        const normalized = message.toLowerCase().trim()

        // Tenta por número primeiro
        const numberMatch = normalized.match(/^\d+$/)
        if (numberMatch) {
            const index = Number.parseInt(numberMatch[0]) - 1
            return this.departments[index] || null
        }

        // Depois por nome parcial
        return (
            this.departments.find(dept =>
                dept.name.toLowerCase().includes(normalized)
            ) || null
        )
    }

    getMenuOptions(): MenuOption[] {
        return this.departments.map((dept, index) => ({
            key: (index + 1).toString(),
            label: dept.name,
        }))
    }

    getStateInfo(): StateInfo {
        return {
            name: 'department_selection',
            requiresExternalData: false,
            nextPossibleStates: ['department_chat', 'initial_menu'],
        }
    }
}
