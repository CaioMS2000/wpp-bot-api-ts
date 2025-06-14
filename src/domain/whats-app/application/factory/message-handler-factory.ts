import { OutputPort } from '@/core/output/output-port'
import { ClientRepository } from '@/domain/repositories/client-repository'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { MessageRepository } from '@/domain/repositories/message-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { MessageHandler } from '../handler/message-handler'
import { ClientMessageHandler } from '../handler/client-message-handler'
import { EmployeeMessageHandler } from '../handler/employee-message-handler'

export class MessageHandlerFactory {
    constructor(
        private outputPort: OutputPort,
        private conversationRepository: ConversationRepository,
        private departmentRepository: DepartmentRepository,
        private faqRepository: FAQRepository,
        private messageRepository: MessageRepository,
        private clientRepository: ClientRepository,
        private employeeRepository: EmployeeRepository
    ) {}

    createClientMessageHandler(): MessageHandler {
        return new ClientMessageHandler(
            this.outputPort,
            this.conversationRepository,
            this.departmentRepository,
            this.faqRepository,
            this.messageRepository,
            this.clientRepository,
            this.employeeRepository
        )
    }

    createEmployeeMessageHandler(): MessageHandler {
        return new EmployeeMessageHandler(
            this.outputPort,
            this.conversationRepository,
            // this.departmentRepository,
            this.messageRepository
            // this.clientRepository
        )
    }
}
