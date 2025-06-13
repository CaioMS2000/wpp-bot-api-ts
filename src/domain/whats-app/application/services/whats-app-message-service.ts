import { OutputPort } from '@/core/output/output-port'
import { Client } from '@/domain/entities/client'
import { ClientRepository } from '@/domain/repositories/client-repository'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { MessageRepository } from '@/domain/repositories/message-repository'
import { Employee } from '@/domain/entities/employee'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { MessageHandler } from '../handler/message-handler'
import { ClientMessageHandler } from '../handler/client-message-handler'
import { MessageHandlerFactory } from '../factory/message-handler-factory'

export class WhatsAppMessageService {
    private messageHandlers: Record<string, MessageHandler>

    constructor(
        private outputPort: OutputPort,
        private conversationRepository: ConversationRepository,
        public departmentRepository: DepartmentRepository,
        public faqRepository: FAQRepository,
        private messageRepository: MessageRepository,
        private clientRepository: ClientRepository,
        public employeeRepository: EmployeeRepository,
        private messageHandlerFactory: MessageHandlerFactory
    ) {
        this.messageHandlers = this.initializeMessageHandlers()
    }

    async processIncomingMessage(phone: string, messageContent: string) {
        console.clear()
        console.log('\n\n\n\n\n\n\nprocessIncomingMessage')
        console.log(`message content: ${messageContent}`)

        const user = await this.identifyUser(phone)
        const messageHandler = this.getHandlerForUser(user)
        await messageHandler.process(user, messageContent)
    }

    private async getOrCreateClient(phone: string): Promise<Client> {
        console.log(`look for client with this phone: ${phone}`)
        let client = await this.clientRepository.findByPhone(phone)

        if (!client) {
            console.log('we need to create a new client')
            client = Client.create({
                phone,
                department: '',
                event_history: [],
            })
            await this.clientRepository.save(client)
        }

        return client
    }

    private async getEmployee(phone: string): Promise<Nullable<Employee>> {
        console.log(`look for employee with this phone: ${phone}`)
        const employee = await this.employeeRepository.findByPhone(phone)

        return employee
    }
    private initializeMessageHandlers(): Record<string, MessageHandler> {
        return {
            clientMessageHandler:
                this.messageHandlerFactory.createClientMessageHandler(),
            employeeMessageHandler:
                this.messageHandlerFactory.createEmployeeMessageHandler(),
        }
    }

    private async identifyUser(phone: string): Promise<Client | Employee> {
        const employee = await this.getEmployee(phone)
        if (employee) return employee

        return this.getOrCreateClient(phone)
    }

    private getHandlerForUser(user: Client | Employee): MessageHandler {
        if (this.isClient(user)) {
            return this.messageHandlers.clientMessageHandler
        }

        if (this.isEmployee(user)) {
            return this.messageHandlers.employeeMessageHandler
        }

        throw new Error('Invalid user type')
    }

    private isClient(user: Client | Employee): user is Client {
        return user instanceof Client
    }

    private isEmployee(user: Client | Employee): user is Employee {
        return user instanceof Employee
    }
}
