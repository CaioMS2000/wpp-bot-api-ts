import { WhatsAppMessageService } from '@/domain/whats-app/application/services/whats-app-message-service'
import { InMemoryRepositoryFactory } from './in-memory-repository-factory'
import { ConsoleOutputPort } from '@/core/output/console-output-port'

export class WhatsAppMessageServiceFactory {
    inMemoryRepositoryFactory = new InMemoryRepositoryFactory()

    static create() {
        return new WhatsAppMessageService(
            new ConsoleOutputPort(),
            InMemoryRepositoryFactory.createConversationRepository(),
            InMemoryRepositoryFactory.createDepartmentRepository(),
            InMemoryRepositoryFactory.createFAQRepository(),
            InMemoryRepositoryFactory.createMessageRepository(),
            InMemoryRepositoryFactory.createClientRepository()
        )
    }
}
