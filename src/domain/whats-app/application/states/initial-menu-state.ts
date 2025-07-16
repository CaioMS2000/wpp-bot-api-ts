import { logger } from '@/core/logger'
import { OutputMessage, OutputPort } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { Employee } from '@/domain/entities/employee'
import { Message } from '@/domain/entities/message'
import { isClient, isEmployee } from '@/utils/entity'
import { execute } from '@caioms/ts-utils/functions'
import { MenuOption } from '../../@types'
import { StartNextClientConversationUseCase } from '../use-cases/start-next-client-conversation-use-case'
import { ConversationState } from './conversation-state'
import { StateTypeMapper } from './types'

export class InitialMenuState extends ConversationState<null> {
    constructor(
        conversation: Conversation,
        outputPort: OutputPort,
        private startNextClientConversationUseCase: StartNextClientConversationUseCase
    ) {
        super(conversation, outputPort)
    }
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

    async handleMessage(message: Message): Promise<Nullable<StateTypeMapper>> {
        logger.debug('[InitialMenuState.handleMessage]\n', {
            message,
        })
        let res: Nullable<StateTypeMapper> = null

        if (isClient(this.conversation.user)) {
            res = this.handleClientMessage(message)
        }

        if (isEmployee(this.conversation.user)) {
            res = await this.handleEmployeeMessage(
                this.conversation.user,
                message
            )
        }

        if (!res) {
            await execute(this.outputPort.handle, this.conversation.user, {
                type: 'text',
                content: '‼️ *Opção inválida*',
            })
            await this.sendSelectionMessage()
        }

        return res
    }

    async onEnter() {
        await this.sendSelectionMessage()
    }

    private async sendSelectionMessage() {
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

    private handleClientMessage(message: Message): Nullable<StateTypeMapper> {
        if (message.content === 'Conversar com IA') {
            return { stateName: 'AIChatState' }
        }

        if (message.content === 'Ver Departamentos') {
            return { stateName: 'DepartmentSelectionState' }
        }

        if (message.content === 'FAQ') {
            return { stateName: 'FAQCategoriesState' }
        }

        return null
    }

    private async handleEmployeeMessage(
        employee: Employee,
        message: Message
    ): Promise<Nullable<StateTypeMapper>> {
        if (message.content === 'FAQ') {
            return { stateName: 'FAQCategoriesState' }
        }

        if (message.content === 'Ver fila') {
            if (!employee.department) {
                return null
            }
            return {
                stateName: 'ListDepartmentQueueState',
                params: { departmentId: employee.department.id },
            }
        }

        if (message.content === 'Atender próximo') {
            if (!employee.department) {
                return null
            }

            const nextClient =
                await this.startNextClientConversationUseCase.execute(
                    this.conversation,
                    employee.department.id
                )

            return {
                stateName: 'ChatWithClientState',
                params: { clientPhoneNumber: nextClient.phone },
            }
        }

        return null
    }
}
