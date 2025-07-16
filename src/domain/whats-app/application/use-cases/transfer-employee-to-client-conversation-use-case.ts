import { logger } from '@/core/logger'
import { OutputPort } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { isEmployee } from '@/utils/entity'
import { StateFactory } from '../factory/state-factory'

export class TransferEmployeeToClientConversationUseCase {
    constructor(
        private conversationRepository: ConversationRepository,
        private departmentRepository: DepartmentRepository,
        private stateFactory: StateFactory
    ) {}
    async execute(conversation: Conversation) {
        if (isEmployee(conversation.user)) {
            if (!conversation.user.department) {
                throw new Error('Employee does not belong to any department')
            }

            const employee = conversation.user
            const department = await this.departmentRepository.find(
                conversation.company,
                conversation.user.department.id
            )

            if (!department) {
                throw new Error('Employee does not belong to any department')
            }

            const departmentQueue = department.queue
            const client = departmentQueue.shift()

            if (!client) {
                throw new Error('Department queue is empty')
            }

            logger.debug(
                'looking for client conversation with client phone: ',
                client.phone
            )
            const clientConversation =
                await this.conversationRepository.findActiveByClientPhoneOrThrow(
                    conversation.company,
                    client.phone
                )

            clientConversation.upsertAgent(employee)
            clientConversation.transitionToState(
                this.stateFactory.create(clientConversation, {
                    stateName: 'DepartmentChatState',
                    params: { departmentId: department.id },
                })
            )
            await this.conversationRepository.save(clientConversation)

            return client
        }
        throw new Error('User is not an employee')
    }
}
