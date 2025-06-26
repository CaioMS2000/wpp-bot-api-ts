import { logger } from '@/core/logger'
import { ConsoleOutputPort } from '@/core/output/console-output-port'
import { FileOutputPort } from '@/core/output/file-output-port'
import { OutputPort } from '@/core/output/output-port'
import { MessageHandlerFactory } from '@/domain/whats-app/application/factory/message-handler-factory'
import { RepositoryFactory } from '@/domain/whats-app/application/factory/repository-factory'
import { UseCaseFactory } from '@/domain/whats-app/application/factory/use-case-factory'
import { WhatsAppMessageService } from '@/domain/whats-app/application/services/whats-app-message-service'

const currentOutputPort: OutputPort = new FileOutputPort()
// const currentOutputPort: OutputPort = new ConsoleOutputPort()

export class PrismaWhatsAppMessageServiceFactory {
    constructor(
        private useCaseFactory: UseCaseFactory,
        private repositoryFactory: RepositoryFactory
    ) {}
    createService() {
        // const outputPort = currentOutputPort
        const outputPort = new FileOutputPort()
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

        // logger.debug(`[PrismaWhatsAppMessageServiceFactory] currentOutputPort:\n${currentOutputPort}\n${JSON.stringify(Object.entries(currentOutputPort))}\n${JSON.stringify(currentOutputPort)}`)
        console.log(
            '[PrismaWhatsAppMessageServiceFactory] currentOutputPort:\n',
            currentOutputPort
        )
        // logger.debug(`[PrismaWhatsAppMessageServiceFactory] outputPort:\n${outputPort}\n${JSON.stringify(Object.entries(outputPort))}\n${JSON.stringify(outputPort)}`)
        console.log(
            '[PrismaWhatsAppMessageServiceFactory] outputPort:\n',
            outputPort
        )
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
            this.useCaseFactory.getInsertClientIntoDepartmentQueue()
        )

        return new WhatsAppMessageService(
            departmentRepository,
            faqRepository,
            messageHandlerFactory,
            this.useCaseFactory.getResolveSenderContextUseCase()
        )
    }
}
