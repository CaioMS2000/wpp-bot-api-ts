import { OutputMessage } from '@/core/output/output-port'
import { isClient, isEmployee } from '@/utils/entity'
import { execute } from '@caioms/ts-utils/functions'
import { MenuOption } from '../../@types'
import { TransitionIntent } from '../factory/types'
import { ConversationState } from './conversation-state'

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

    async handleMessage(
        messageContent: string
    ): Promise<Nullable<TransitionIntent>> {
        let res: Nullable<TransitionIntent> = null

        if (isClient(this.conversation.user)) {
            res = this.handleClientMessage(messageContent)
        }

        if (isEmployee(this.conversation.user)) {
            res = this.handleEmployeeMessage(messageContent)
        }

        return res
    }

    async onEnter() {
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

        await execute(
            this.outputPort.handle,
            this.conversation.user,
            listOutput
        )
    }

    private handleClientMessage(
        messageContent: string
    ): Nullable<TransitionIntent> {
        if (messageContent === 'Conversar com IA') {
            return { target: 'ai_chat' }
        }

        if (messageContent === 'Ver Departamentos') {
            return { target: 'department_selection' }
        }

        if (messageContent === 'FAQ') {
            return { target: 'faq_categories' }
        }

        return null
    }

    private handleEmployeeMessage(
        messageContent: string
    ): Nullable<TransitionIntent> {
        if (messageContent === 'FAQ') {
            return { target: 'faq_categories' }
        }

        if (messageContent === 'Ver fila') {
            return { target: 'department_queue_list' }
        }

        if (messageContent === 'Atender próximo') {
            return { target: 'chat_with_client' }
        }

        return null
    }
}
