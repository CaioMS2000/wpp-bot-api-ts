import { inspect } from 'node:util'
import { logger } from '@/core/logger'
import { OutputMessage } from '@/core/output/output-port'
import { isClient, isEmployee } from '@/utils/entity'
import { formatMenuOptions } from '@/utils/menu'
import { execute } from '@caioms/ts-utils/functions'
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

    async handleMessage(messageContent: string): Promise<StateTransition> {
        let res: NotDefined<Nullable<StateTransition>> = undefined

        if (isClient(this.conversation.user)) {
            res = this.handleClientMessage(messageContent)
        }

        if (isEmployee(this.conversation.user)) {
            res = this.handleEmployeeMessage(messageContent)
        }

        return res ?? StateTransition.stayInCurrent()
    }

    async onEnter() {
        if (!this.config.outputPort) {
            throw new Error('Output port not set')
        }

        const availableOptions = this.menuOptions.filter(opt => {
            if (isClient(this.conversation.user)) return opt.forClient
            return opt.forEmployee
        })

        const listOutput: OutputMessage = {
            type: 'list',
            text: 'Escolha uma das opções abaixo:',
            buttonText: 'Menu',
            sections: [
                {
                    title: 'Menu principal',
                    rows: availableOptions.map(opt => ({
                        id: opt.key,
                        title: opt.label,
                    })),
                },
            ],
        } as const

        // this.config.outputPort.handle(this.conversation.user, listOutput)
        await execute(
            this.config.outputPort.handle,
            this.conversation.user,
            listOutput
        )
    }

    private handleClientMessage(messageContent: string) {
        if (messageContent === 'Conversar com IA') {
            return StateTransition.toAIChat()
        }

        if (messageContent === 'Ver Departamentos') {
            return StateTransition.toDepartmentSelection()
        }

        if (messageContent === 'FAQ') {
            return StateTransition.toFAQCategories()
        }
    }

    private handleEmployeeMessage(messageContent: string) {
        if (messageContent === 'FAQ') {
            return StateTransition.toFAQCategories()
        }

        if (messageContent === 'Ver fila') {
            return StateTransition.toDepartmentListQueue()
        }

        if (messageContent === 'Atender próximo') {
            return StateTransition.toChatWithClient()
        }
    }
}
