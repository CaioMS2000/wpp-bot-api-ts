import { logger } from '@/core/logger'
import { OutputPort } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { Message } from '@/domain/entities/message'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { execute } from '@caioms/ts-utils/functions'
import { RemoveClientFromDepartmentQueue } from '../../use-cases/remove-client-from-department-queue'
import { ConversationState } from '../conversation-state'
import { StateTypeMapper } from '../types'

type DepartmentQueueStateProps = {
    departmentId: string
}

export class DepartmentQueueState extends ConversationState<DepartmentQueueStateProps> {
    constructor(
        conversation: Conversation,
        outputPort: OutputPort,
        private departmentRepository: DepartmentRepository,
        private removeClientFromDepartmentQueue: RemoveClientFromDepartmentQueue,
        departmentId: string
    ) {
        super(conversation, outputPort, { departmentId })
    }

    get departmentId() {
        return this.props.departmentId
    }

    async handleMessage(message: Message): Promise<Nullable<StateTypeMapper>> {
        if (message.content === 'sair') {
            return { stateName: 'InitialMenuState' }
        }

        const department = await this.departmentRepository.find(
            this.conversation.company,
            this.departmentId
        )

        if (!department) {
            throw new Error(`Department not found: ${this.departmentId}`)
        }

        await execute(this.outputPort.handle, this.conversation.user, {
            type: 'text',
            content: `🔔 Você está na fila de espera do *${department.name}*, em breve um atendente entrará em contato. Caso queira sair da fila de espera, digite "sair".`,
        })

        return null
    }

    async onEnter() {
        const department = await this.departmentRepository.find(
            this.conversation.company,
            this.departmentId
        )

        if (!department) {
            throw new Error(`Department not found: ${this.departmentId}`)
        }
        await execute(this.outputPort.handle, this.conversation.user, {
            type: 'text',
            content: `🔔 Você está na fila de espera do departamento *${department.name}*, em breve um atendente entrará em contato. Caso queira sair da fila de espera, digite "sair".`,
        })
    }

    async onExit() {
        const department = await this.departmentRepository.find(
            this.conversation.company,
            this.departmentId
        )

        if (!department) {
            throw new Error(`Department not found: ${this.departmentId}`)
        }
        await this.removeClientFromDepartmentQueue.execute(
            department,
            this.conversation.user
        )
    }
}
