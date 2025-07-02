import { WhatsAppOutputPort } from '@/infra/http/output/whats-app-output-port'
import { ProcessEmployeeMessageService } from '../services/process-employee-message-service'
import { RepositoryFactory } from './repository-factory'
import { StateTransitionServiceFactory } from './state-transition-service-factory'
import { UseCaseFactory } from './use-case-factory'

export class ProcessEmployeeMessageServiceFactory {
    constructor(
        private repositoryFactory: RepositoryFactory,
        private useCaseFactory: UseCaseFactory,
        private stateTransitionServiceFactory: StateTransitionServiceFactory
    ) {}

    createService() {
        const outputPort = new WhatsAppOutputPort()
        const messageRepository =
            this.repositoryFactory.createMessageRepository()
        const conversationRepository =
            this.repositoryFactory.createConversationRepository()
        const findConversationByEmployeePhoneUseCase =
            this.useCaseFactory.getFindConversationByEmployeePhoneUseCase()
        const createConversationUseCase =
            this.useCaseFactory.getCreateConversationUseCase()
        const stateTransitionService =
            this.stateTransitionServiceFactory.createService()
        return new ProcessEmployeeMessageService(
            messageRepository,
            conversationRepository,
            findConversationByEmployeePhoneUseCase,
            createConversationUseCase,
            stateTransitionService,
            { outputPort }
        )
    }
}
