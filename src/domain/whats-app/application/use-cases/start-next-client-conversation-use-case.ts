import { Conversation } from '@/domain/entities/conversation'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { type StateFactory } from '../factory/state-factory'
import { DepartmentQueueService } from '../services/department-queue-service'
import { TransferEmployeeToClientConversationUseCase } from './transfer-employee-to-client-conversation-use-case'

export class StartNextClientConversationUseCase {
    constructor(
        private stateFactory: StateFactory,
        private departmentQueueService: DepartmentQueueService,
        private conversationRepository: ConversationRepository,
        private departmentRepository: DepartmentRepository,
        private transferEmployeeToClientConversationUseCase: TransferEmployeeToClientConversationUseCase
    ) {}

    async execute(conversation: Conversation, departmentId: string) {
        const nextClient = await this.departmentQueueService.getNextClient(
            conversation,
            departmentId
        )

        if (!nextClient) {
            throw new Error('No clients in queue')
        }

        const clientConversation =
            await this.conversationRepository.findActiveByClientPhoneOrThrow(
                conversation.company,
                nextClient.phone
            )
        const department = await this.departmentRepository.find(
            conversation.company,
            departmentId
        )

        if (!department) {
            throw new Error(`Department not found: ${departmentId}`)
        }

        clientConversation.transitionToState(
            this.stateFactory.create(conversation, {
                stateName: 'DepartmentChatState',
                params: { departmentId: department.id },
            })
        )
        await this.conversationRepository.save(clientConversation)
        await await this.transferEmployeeToClientConversationUseCase.execute(
            conversation
        )

        return nextClient
    }
}
