import { inspect } from 'node:util'
import { logger } from '@/core/logger'
import { isClient, isEmployee } from '@/utils/entity'
import { MenuOption } from '../../@types'
import { ConversationState } from './conversation-state'
import { StateTransition } from './state-transition'
import { formatMenuOptions } from '@/utils/menu'

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
        let res: NotDefined<Nullable<StateTransition>> = undefined

        if (isClient(this.conversation.user)) {
            res = this.handleClientMessage(messageContent)
        }

        if (isEmployee(this.conversation.user)) {
            res = this.handleEmployeeMessage(messageContent)
        }

        return res ?? StateTransition.stayInCurrent()
    }

    onEnter() {
        if (!this.config.outputPort) {
            throw new Error('Output port not set')
        }

        const object = {
            data: {
                output: formatMenuOptions(
                    this.menuOptions.filter(opt => {
                        if (isClient(this.conversation.user)) {
                            return opt.forClient
                        }

                        return opt.forEmployee
                    })
                ),
                input: null as any,
            },
        }
        const lastMessage = this.conversation.messages.pop()

        if (lastMessage) {
            this.conversation.messages.push(lastMessage)
            object.data.input = lastMessage.content
        }

        this.config.outputPort.handle(
            this.conversation.user,
            JSON.stringify(object, null)
        )
    }

    private handleClientMessage(messageContent: string) {
        if (messageContent === '1') {
            return StateTransition.toAIChat()
        }

        if (messageContent === '2') {
            return StateTransition.toDepartmentSelection()
        }

        if (messageContent === '3') {
            return StateTransition.toFAQCategories()
        }
    }

    private handleEmployeeMessage(messageContent: string) {
        if (messageContent === '3') {
            return StateTransition.toFAQCategories()
        }

        if (messageContent === '4') {
            return StateTransition.toDepartmentListQueue()
        }

        if (messageContent === '5') {
            return StateTransition.toChatWithClient()
        }
    }
}
