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
import { FindConversationByUserPhoneUseCase } from '../use-cases/find-conversation-by-user-phone'
import { ListActiveDepartmentsUseCase } from '../use-cases/list-active-departments-use-case'
import { ListFAQCategorieItemsUseCase } from '../use-cases/list-faq-categorie-items-use-case'
import { ListFAQCategoriesUseCase } from '../use-cases/list-faq-categories-use-case'

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
        private findConversationByUserPhoneUseCase: FindConversationByUserPhoneUseCase
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
            this.findConversationByUserPhoneUseCase
        )
    }

    createEmployeeMessageHandler(): MessageHandler {
        return new EmployeeMessageHandler(
            this.outputPort,
            this.messageRepository,
            this.conversationRepository,
            this.faqRepository,
            this.findConversationByUserPhoneUseCase,
            this.createConversationUseCase
        )
    }
}
