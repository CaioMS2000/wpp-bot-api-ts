import { MenuOption } from '../../@types'
import { ConversationState } from './conversation-state'
import { StateTransition } from './state-transition'

export class InitialMenuState extends ConversationState {
    handleMessage(messageContent: string): StateTransition {
        if (messageContent === '1') {
            return StateTransition.toAIChat()
        }

        if (messageContent === '2') {
            return StateTransition.toDepartmentSelection()
        }

        if (messageContent === '3') {
            return StateTransition.toFAQCategories()
        }

        return StateTransition.stayInCurrent(this.entryMessage)
    }

    get entryMessage() {
        return this.formatMenuOptions([
            { key: '1', label: 'Conversar com IA' },
            { key: '2', label: 'Ver Departamentos' },
            { key: '3', label: 'FAQ' },
        ])
    }
}
