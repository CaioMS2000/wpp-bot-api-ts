import { ProcessEmployeeMessageService } from '../services/process-employee-message-service'
import { RepositoryFactory } from './repository-factory'
import { UseCaseFactory } from './use-case-factory'
import { StateFactory } from './state-factory'

export class ProcessEmployeeMessageServiceFactory {
    constructor(
        private repositoryFactory: RepositoryFactory,
        private useCaseFactory: UseCaseFactory,
        private stateFactory: StateFactory
    ) {}

    createService() {
        const messageRepository =
            this.repositoryFactory.createMessageRepository()
        const conversationRepository =
            this.repositoryFactory.createConversationRepository()
        const findConversationByEmployeePhoneUseCase =
            this.useCaseFactory.getFindConversationByEmployeePhoneUseCase()
        const createConversationUseCase =
            this.useCaseFactory.getCreateConversationUseCase()
        return new ProcessEmployeeMessageService(
            this.stateFactory,
            messageRepository,
            conversationRepository,
            findConversationByEmployeePhoneUseCase,
            createConversationUseCase
        )
    }
}
