import { RepositoryFactory } from '@/domain/whats-app/application/factory/repository-factory'
import { UseCaseFactory } from '@/domain/whats-app/application/factory/use-case-factory'
import { ProcessClientMessageService } from '../services/process-client-message-service'
import { StateFactory } from './state-factory'

export class ProcessClientMessageServiceFactory {
    constructor(
        private repositoryFactory: RepositoryFactory,
        private useCaseFactory: UseCaseFactory,
        private stateFactory: StateFactory
    ) {}

    getService() {
        const messageRepository = this.repositoryFactory.getMessageRepository()
        const conversationRepository =
            this.repositoryFactory.getConversationRepository()
        const createConversationUseCase =
            this.useCaseFactory.getCreateConversationUseCase()
        const findConversationByClientPhoneUseCase =
            this.useCaseFactory.getFindConversationByClientPhoneUseCase()
        return new ProcessClientMessageService(
            messageRepository,
            conversationRepository,
            createConversationUseCase,
            findConversationByClientPhoneUseCase,
            this.stateFactory
        )
    }
}
