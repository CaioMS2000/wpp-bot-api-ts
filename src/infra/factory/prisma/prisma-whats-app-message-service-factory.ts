import { logger } from '@/core/logger'
import { ConsoleOutputPort } from '@/core/output/console-output-port'
import { FileOutputPort } from '@/core/output/file-output-port'
import { OutputPort } from '@/core/output/output-port'
import { MessageHandlerFactory } from '@/domain/whats-app/application/factory/message-handler-factory'
import { RepositoryFactory } from '@/domain/whats-app/application/factory/repository-factory'
import { UseCaseFactory } from '@/domain/whats-app/application/factory/use-case-factory'
import { WhatsAppMessageService } from '@/domain/whats-app/application/services/whats-app-message-service'
import { WhatsAppOutputPort } from '@/infra/http/output/whats-app-output-port'

const currentOutputPort: OutputPort = new FileOutputPort()
// const currentOutputPort: OutputPort = new ConsoleOutputPort()

export class PrismaWhatsAppMessageServiceFactory {
    constructor(
        private useCaseFactory: UseCaseFactory,
        private repositoryFactory: RepositoryFactory
    ) {}
    createService() {
        // const outputPort = currentOutputPort
        // const outputPort = new FileOutputPort()
        const outputPort = new WhatsAppOutputPort()
        const conversationRepository =
            this.repositoryFactory.createConversationRepository()
        const departmentRepository =
            this.repositoryFactory.createDepartmentRepository()
        const faqRepository = this.repositoryFactory.createFAQRepository()
        const messageRepository =
            this.repositoryFactory.createMessageRepository()
        const clientRepository = this.repositoryFactory.createClientRepository()
        const employeeRepository =
            this.repositoryFactory.createEmployeeRepository()

        const messageHandlerFactory = new MessageHandlerFactory(
            outputPort,
            conversationRepository,
            faqRepository,
            messageRepository,
            employeeRepository,
            departmentRepository,
            this.useCaseFactory.getListActiveDepartmentsUseCase(),
            this.useCaseFactory.getListFAQCategoriesUseCase(),
            this.useCaseFactory.getListFAQCategorieItemsUseCase(),
            this.useCaseFactory.getCreateConversationUseCase(),
            this.useCaseFactory.getFindConversationByClientPhoneUseCase(),
            this.useCaseFactory.getFindConversationByEmployeePhoneUseCase(),
            this.useCaseFactory.getTransferEmployeeToClientConversationUseCase(),
            this.useCaseFactory.getInsertClientIntoDepartmentQueue(),
            this.useCaseFactory.getRemoveClientFromDepartmentQueue()
        )

        return new WhatsAppMessageService(
            departmentRepository,
            faqRepository,
            messageHandlerFactory,
            this.useCaseFactory.getResolveSenderContextUseCase()
        )
    }
}
