import { WhatsAppMessageService } from '@/domain/whats-app/application/services/whats-app-message-service'
import { InMemoryRepositoryFactory } from './in-memory-repository-factory'
import { ConsoleOutputPort } from '@/core/output/console-output-port'
import { FileOutputPort } from '@/core/output/file-output-port'
import { OutputPort } from '@/core/output/output-port'

const currentOutputPort: OutputPort = new FileOutputPort()
// const currentOutputPort: OutputPort = new ConsoleOutputPort()

export class WhatsAppMessageServiceFactory {
    inMemoryRepositoryFactory = new InMemoryRepositoryFactory()

    static create() {
        return new WhatsAppMessageService(
            currentOutputPort,
            InMemoryRepositoryFactory.createConversationRepository(),
            InMemoryRepositoryFactory.createDepartmentRepository(),
            InMemoryRepositoryFactory.createFAQRepository(),
            InMemoryRepositoryFactory.createMessageRepository(),
            InMemoryRepositoryFactory.createClientRepository()
        )
    }
}
