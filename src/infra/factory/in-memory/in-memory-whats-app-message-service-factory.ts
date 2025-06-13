import { ConsoleOutputPort } from '@/core/output/console-output-port'
import { FileOutputPort } from '@/core/output/file-output-port'
import { OutputPort } from '@/core/output/output-port'
import { MessageHandlerFactory } from '@/domain/whats-app/application/factory/message-handler-factory'
import { WhatsAppMessageService } from '@/domain/whats-app/application/services/whats-app-message-service'
import { InMemoryRepositoryFactory } from './in-memory-repository-factory'

const currentOutputPort: OutputPort = new FileOutputPort()
// const currentOutputPort: OutputPort = new ConsoleOutputPort()

export class InMemoryWhatsAppMessageServiceFactory {
    static create() {
        const outputPort = currentOutputPort
        const conversationRepository =
            InMemoryRepositoryFactory.createConversationRepository()
        const departmentRepository =
            InMemoryRepositoryFactory.createDepartmentRepository()
        const faqRepository = InMemoryRepositoryFactory.createFAQRepository()
        const messageRepository =
            InMemoryRepositoryFactory.createMessageRepository()
        const clientRepository =
            InMemoryRepositoryFactory.createClientRepository()
        const employeeRepository =
            InMemoryRepositoryFactory.createEmployeeRepository()

        const messageHandlerFactory = new MessageHandlerFactory(
            outputPort,
            conversationRepository,
            departmentRepository,
            faqRepository,
            messageRepository,
            clientRepository,
            employeeRepository
        )

        return new WhatsAppMessageService(
            outputPort,
            conversationRepository,
            departmentRepository,
            faqRepository,
            messageRepository,
            clientRepository,
            employeeRepository,
            messageHandlerFactory
        )
    }
}
