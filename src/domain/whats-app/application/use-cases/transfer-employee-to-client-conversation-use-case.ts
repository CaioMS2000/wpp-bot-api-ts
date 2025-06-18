import { Conversation } from '@/domain/entities/conversation'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { isEmployee } from '@/utils/entity'

export class TransferEmployeeToClientConversationUseCase {
    constructor(private conversationRepository: ConversationRepository) {}
    async execute(conversation: Conversation) {
        if (isEmployee(conversation.user)) {
            const employee = conversation.user
            const department = conversation.user.department

            if (!department) {
                throw new Error('Employee does not belong to any department')
            }

            const departmentQueue = department.queue
            const client = departmentQueue.shift()

            if (!client) {
                throw new Error('Department queue is empty')
            }

            const clientConversation =
                await this.conversationRepository.findActiveByClientPhoneOrThrow(
                    client.phone
                )

            clientConversation.upsertAgent(employee)
            await this.conversationRepository.save(clientConversation)

            return client
        }
        throw new Error('User is not an employee')
    }
}
