import { isClient, isEmployee } from '@/utils/entity'
import { MenuOption } from '../../@types'
import { ConversationState } from './conversation-state'
import { StateTransition } from './state-transition'

export class InitialMenuState extends ConversationState {
    private menuOptions: MenuOption[] = [
        {
            key: '1',
            label: 'Conversar com IA',
            forClient: true,
            forEmployee: true,
        },
        {
            key: '2',
            label: 'Ver Departamentos',
            forClient: true,
            forEmployee: false,
        },
        { key: '3', label: 'FAQ', forClient: true, forEmployee: true },
        {
            key: '4',
            label: 'Ver fila',
            forClient: false,
            forEmployee: true,
        },
        {
            key: '5',
            label: 'Atender próximo',
            forClient: false,
            forEmployee: true,
        },
    ]

    handleMessage(messageContent: string): StateTransition {
        if (isClient(this.conversation.user)) {
            return this.handleClientMessage(messageContent)
        }

        if (isEmployee(this.conversation.user)) {
            return this.handleEmployeeMessage(messageContent)
        }

        return StateTransition.stayInCurrent(this.entryMessage)
    }

    get entryMessage() {
        return this.formatMenuOptions(
            this.menuOptions.filter(opt => {
                if (isClient(this.conversation.user)) {
                    return opt.forClient
                }

                return opt.forEmployee
            })
        )
    }

    private handleClientMessage(messageContent: string): StateTransition {
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

    private handleEmployeeMessage(messageContent: string): StateTransition {
        return StateTransition.stayInCurrent(this.entryMessage)
    }
}
