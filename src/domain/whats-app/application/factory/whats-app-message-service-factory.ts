import { FileOutputPort } from '@/core/output/file-output-port'
import { OutputPort } from '@/core/output/output-port'
import { MessageHandlerFactory } from '@/domain/whats-app/application/factory/message-handler-factory'
import { RepositoryFactory } from '@/domain/whats-app/application/factory/repository-factory'
import { UseCaseFactory } from '@/domain/whats-app/application/factory/use-case-factory'
import { WhatsAppMessageService } from '@/domain/whats-app/application/services/whats-app-message-service'
import { WhatsAppOutputPort } from '@/infra/http/output/whats-app-output-port'
import { ProcessClientMessageServiceFactory } from './process-client-message-service-factory'
import { ProcessEmployeeMessageServiceFactory } from './process-employee-message-service-factory'

export class WhatsAppMessageServiceFactory {
    constructor(
        private repositoryFactory: RepositoryFactory,
        private useCaseFactory: UseCaseFactory,
        private processClientMessageServiceFactory: ProcessClientMessageServiceFactory,
        private processEmployeeMessageServiceFactory: ProcessEmployeeMessageServiceFactory
    ) {}
    createService() {
        const processClientMessageService =
            this.processClientMessageServiceFactory.createService()
        const processEmployeeMessageService =
            this.processEmployeeMessageServiceFactory.createService()
        const messageHandlerFactory = new MessageHandlerFactory(
            processClientMessageService,
            processEmployeeMessageService
        )
        const departmentRepository =
            this.repositoryFactory.createDepartmentRepository()
        const faqRepository = this.repositoryFactory.createFAQRepository()
        const resolveSenderContextUseCase =
            this.useCaseFactory.getResolveSenderContextUseCase()

        return new WhatsAppMessageService(
            departmentRepository,
            faqRepository,
            messageHandlerFactory,
            resolveSenderContextUseCase
        )
    }
}
