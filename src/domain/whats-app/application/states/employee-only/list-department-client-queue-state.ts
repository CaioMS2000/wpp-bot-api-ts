import { logger } from '@/core/logger'
import { OutputMessage, OutputPort } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { Message } from '@/domain/entities/message'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { execute } from '@caioms/ts-utils/functions'
import { ConversationState } from '../conversation-state'
import { StateTypeMapper } from '../types'

type ListDepartmentQueueStateProps = {
    departmentId: string
}

export class ListDepartmentQueueState extends ConversationState<ListDepartmentQueueStateProps> {
    constructor(
        conversation: Conversation,
        outputPort: OutputPort,
        private departmentRepository: DepartmentRepository,
        departmentId: string
    ) {
        super(conversation, outputPort, { departmentId })
    }

    get departmentId() {
        return this.props.departmentId
    }

    async handleMessage(message: Message): Promise<Nullable<StateTypeMapper>> {
        throw new Error(
            'This state should not even last long enough to handle a message'
        )
    }

    async onEnter() {
        const department = await this.departmentRepository.find(
            this.conversation.company,
            this.departmentId
        )

        if (!department) {
            throw new Error(`Department not found: ${this.departmentId}`)
        }

        if (department.queue.length === 0) {
            return await execute(
                this.outputPort.handle,
                this.conversation.user,
                {
                    type: 'text',
                    content: '🔔 *Fila vazia*',
                }
            )
        }

        const textOutput: OutputMessage = {
            type: 'text',
            content: department.queue.reduce((acc, client) => {
                return `${acc}*${client.name}*: ${client.phone}\n`
            }, '*Fila:*\n'),
        }

        await execute(
            this.outputPort.handle,
            this.conversation.user,
            textOutput
        )
    }

    async getNextState(message = ''): Promise<Nullable<StateTypeMapper>> {
        return { stateName: 'InitialMenuState' }
    }
}
