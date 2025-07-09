import { OutputPort } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { execute } from '@caioms/ts-utils/functions'
import { TransitionIntent } from '../../factory/types'
import { ConversationState } from '../conversation-state'
import { RemoveClientFromDepartmentQueue } from '../../use-cases/remove-client-from-department-queue'

type DepartmentQueueStateProps = {
    department: Department
}

export class DepartmentQueueState extends ConversationState<DepartmentQueueStateProps> {
    constructor(
        conversation: Conversation,
        outputPort: OutputPort,
        department: Department,
        private removeClientFromDepartmentQueue: RemoveClientFromDepartmentQueue
    ) {
        super(conversation, outputPort, { department })
    }

    get department() {
        return this.props.department
    }

    async handleMessage(
        messageContent: string
    ): Promise<Nullable<TransitionIntent>> {
        if (messageContent === 'sair') {
            return { target: 'initial_menu' }
        }

        await execute(this.outputPort.handle, this.conversation.user, {
            type: 'text',
            content: `🔔 Você está na fila de espera do *${this.department.name}*, em breve um atendente entrará em contato. Caso queira sair da fila de espera, digite "sair".`,
        })

        return null
    }

    async onEnter() {
        await execute(this.outputPort.handle, this.conversation.user, {
            type: 'text',
            content: `🔔 Você está na fila de espera do departamento *${this.department.name}*, em breve um atendente entrará em contato. Caso queira sair da fila de espera, digite "sair".`,
        })
    }

    async onExit() {
        await this.removeClientFromDepartmentQueue.execute(
            this.department,
            this.conversation.user
        )
    }
}
