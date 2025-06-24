import { OutputPort } from '@/core/output/output-port'
import { ClientRepository } from '@/domain/repositories/client-repository'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { MessageRepository } from '@/domain/repositories/message-repository'
import { ClientMessageHandler } from '../handler/client-message-handler'
import { EmployeeMessageHandler } from '../handler/employee-message-handler'
import { MessageHandler } from '../handler/message-handler'
import { CreateConversationUseCase } from '../use-cases/create-conversation-use-case'
import { FindConversationByClientPhoneUseCase } from '../use-cases/find-conversation-by-client-phone-use-case'
import { FindConversationByEmployeePhoneUseCase } from '../use-cases/find-conversation-by-employee-phone-use-case'
import { ListActiveDepartmentsUseCase } from '../use-cases/list-active-departments-use-case'
import { ListFAQCategorieItemsUseCase } from '../use-cases/list-faq-categorie-items-use-case'
import { ListFAQCategoriesUseCase } from '../use-cases/list-faq-categories-use-case'
import { TransferEmployeeToClientConversationUseCase } from '../use-cases/transfer-employee-to-client-conversation-use-case'
import { InsertClientIntoDepartmentQueue } from '../use-cases/insert-client-into-department-queue'

export class MessageHandlerFactory {
    constructor(
        private outputPort: OutputPort,
        private conversationRepository: ConversationRepository,
        private faqRepository: FAQRepository,
        private messageRepository: MessageRepository,
        private employeeRepository: EmployeeRepository,
        private listActiveDepartmentsUseCase: ListActiveDepartmentsUseCase,
        private listFAQCategoriesUseCase: ListFAQCategoriesUseCase,
        private listFAQCategorieItemsUseCase: ListFAQCategorieItemsUseCase,
        private createConversationUseCase: CreateConversationUseCase,
        private findConversationByClientPhoneUseCase: FindConversationByClientPhoneUseCase,
        private findConversationByEmployeePhoneUseCase: FindConversationByEmployeePhoneUseCase,
        private transferEmployeeToClientConversationUseCase: TransferEmployeeToClientConversationUseCase,
        private insertClientIntoDepartmentQueue: InsertClientIntoDepartmentQueue
    ) {}

    createClientMessageHandler(): MessageHandler {
        return new ClientMessageHandler(
            this.outputPort,
            this.messageRepository,
            this.employeeRepository,
            this.conversationRepository,
            this.listActiveDepartmentsUseCase,
            this.listFAQCategoriesUseCase,
            this.listFAQCategorieItemsUseCase,
            this.createConversationUseCase,
            this.findConversationByClientPhoneUseCase,
            this.insertClientIntoDepartmentQueue
        )
    }

    createEmployeeMessageHandler(): MessageHandler {
        return new EmployeeMessageHandler(
            this.outputPort,
            this.messageRepository,
            this.conversationRepository,
            this.faqRepository,
            this.findConversationByEmployeePhoneUseCase,
            this.createConversationUseCase,
            this.listActiveDepartmentsUseCase,
            this.transferEmployeeToClientConversationUseCase
        )
    }
}
