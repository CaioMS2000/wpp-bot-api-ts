import { RepositoryFactory } from '@/domain/whats-app/application/factory/repository-factory'
import { UseCaseFactory } from '@/domain/whats-app/application/factory/use-case-factory'
import { WhatsAppOutputPort } from '@/infra/http/output/whats-app-output-port'
import { ProcessClientMessageService } from '../services/process-client-message-service'
import { StateTransitionServiceFactory } from './state-transition-service-factory'

export class ProcessClientMessageServiceFactory {
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
        const createConversationUseCase =
            this.useCaseFactory.getCreateConversationUseCase()
        const findConversationByClientPhoneUseCase =
            this.useCaseFactory.getFindConversationByClientPhoneUseCase()
        const stateTransitionService =
            this.stateTransitionServiceFactory.createService()
        return new ProcessClientMessageService(
            messageRepository,
            conversationRepository,
            createConversationUseCase,
            findConversationByClientPhoneUseCase,
            stateTransitionService,
            { outputPort }
        )
    }
}
