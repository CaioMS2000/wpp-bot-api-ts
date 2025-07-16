import { logger } from '@/core/logger'
import { OutputPort } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { Message } from '@/domain/entities/message'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { execute } from '@caioms/ts-utils/functions'
import { ConversationState } from '../conversation-state'
import { StateTypeMapper } from '../types'

type DepartmentChatStateProps = {
    departmentId: string
}

export class DepartmentChatState extends ConversationState<DepartmentChatStateProps> {
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
        if (this.conversation.agent && this.conversation.agent !== 'AI') {
            await execute(this.outputPort.handle, this.conversation.agent, {
                type: 'text',
                content: `🔵 *[Cliente] ${this.conversation.user.name}*\n📞 *${this.conversation.user.phone}*\n\n${message.content}`,
            })
        }

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
            content: `🔔 Você está conversando com o departamento: ${department.name}`,
        })
    }

    async onExit() {
        await execute(this.outputPort.handle, this.conversation.user, {
            type: 'text',
            content: '🔔 *O atendimento foi encerrado*',
        })
    }
}
