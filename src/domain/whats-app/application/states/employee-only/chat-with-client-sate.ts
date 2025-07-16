import { logger } from '@/core/logger'
import { OutputPort } from '@/core/output/output-port'
import { Client } from '@/domain/entities/client'
import { Conversation } from '@/domain/entities/conversation'
import { Employee } from '@/domain/entities/employee'
import { Message } from '@/domain/entities/message'
import { ClientRepository } from '@/domain/repositories/client-repository'
import { isEmployee } from '@/utils/entity'
import { execute } from '@caioms/ts-utils/functions'
import { FinishClientAndEmployeeChatUseCase } from '../../use-cases/finish-client-and-employee-chat'
import { RemoveClientFromDepartmentQueue } from '../../use-cases/remove-client-from-department-queue'
import { ConversationState } from '../conversation-state'
import { StateTypeMapper } from '../types'

type ChatWithClientStateProps = {
    clientPhoneNumber: string
}

export class ChatWithClientState extends ConversationState<ChatWithClientStateProps> {
    constructor(
        conversation: Conversation,
        outputPort: OutputPort,
        clientPhoneNumber: string,
        private clientRepository: ClientRepository,
        private finishClientAndEmployeeChatUseCase: FinishClientAndEmployeeChatUseCase,
        private removeClientFromDepartmentQueue: RemoveClientFromDepartmentQueue
    ) {
        super(conversation, outputPort, { clientPhoneNumber })
    }
    async handleMessage(message: Message): Promise<Nullable<StateTypeMapper>> {
        if (!isEmployee(this.conversation.user)) {
            throw new Error('Conversation user is not an employee')
        }

        if (!this.conversation.user.department) {
            throw new Error('Employee does not have a department')
        }

        if (message.content.toLowerCase().trim() === '!finalizar') {
            return { stateName: 'InitialMenuState' }
        }

        const client = await this.clientRepository.findByPhone(
            this.conversation.company,
            this.clientPhoneNumber
        )

        if (!client) {
            throw new Error('Client not found')
        }

        await execute(this.outputPort.handle, client, {
            type: 'text',
            content: `🔵 *[Funcionário] ${this.conversation.user.name}*\n🚩 *${this.conversation.user.department.name}*\n\n${message.content}`,
        })

        return null
    }

    get clientPhoneNumber() {
        return this.props.clientPhoneNumber
    }

    async onEnter() {
        if (!isEmployee(this.conversation.user)) {
            throw new Error('Conversation user is not an employee')
        }

        if (!this.conversation.user.department) {
            throw new Error('Employee does not have a department')
        }
        const client = await this.clientRepository.findByPhone(
            this.conversation.company,
            this.clientPhoneNumber
        )

        if (!client) {
            throw new Error('Client not found')
        }

        await execute(
            this.removeClientFromDepartmentQueue.execute.bind(
                this.removeClientFromDepartmentQueue
            ),
            this.conversation.user.department,
            client
        )
        await execute(this.outputPort.handle, this.conversation.user, {
            type: 'text',
            content: `🔔 Você está conversando com o cliente *${client.name}*\n📞 *${client.phone}*`,
        })
    }

    async onExit() {
        const client = await this.clientRepository.findByPhone(
            this.conversation.company,
            this.clientPhoneNumber
        )

        if (!client) {
            throw new Error('Client not found')
        }

        await this.finishClientAndEmployeeChatUseCase.execute(
            this.conversation.company,
            client,
            this.conversation.user as Employee
        )
        await execute(this.outputPort.handle, this.conversation.user, {
            type: 'text',
            content: `🔔 Atendimento para o cliente *${client.name}* encerrado.`,
        })
    }
}
