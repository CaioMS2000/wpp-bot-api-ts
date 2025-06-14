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
import { MessageHandlerFactory } from '../factory/message-handler-factory'
import { logger } from '@/core/logger'
import { isClient, isEmployee } from '@/utils/entity'

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
        // console.clear()
        logger.info(`\n\n\n\n\n\n\nProcessing new message from ${phone}`)
        logger.debug(`Message content: ${messageContent}`)

        const user = await this.identifyUser(phone)
        const messageHandler = this.getHandlerForUser(user)

        await messageHandler.process(user, messageContent)
        logger.info('Message processed successfully')
    }

    private async getOrCreateClient(phone: string): Promise<Client> {
        logger.debug(`Looking for client with phone: ${phone}`)
        let client = await this.clientRepository.findByPhone(phone)

        if (!client) {
            logger.info(`Creating new client for phone: ${phone}`)
            client = Client.create({
                phone,
            })
            await this.clientRepository.save(client)
        }

        return client
    }

    private async getEmployee(phone: string): Promise<Nullable<Employee>> {
        logger.debug(`Looking for employee with phone: ${phone}`)

        const employee = await this.employeeRepository.findByPhone(phone)

        if (employee) {
            logger.debug(`Employee found: ${employee.id}`)
        }

        return employee
    }
    private initializeMessageHandlers(): Record<string, MessageHandler> {
        logger.debug('Initializing message handlers')

        return {
            clientMessageHandler:
                this.messageHandlerFactory.createClientMessageHandler(),
            employeeMessageHandler:
                this.messageHandlerFactory.createEmployeeMessageHandler(),
        }
    }

    private async identifyUser(phone: string): Promise<Client | Employee> {
        logger.debug(`Identifying user type for phone: ${phone}`)

        const employee = await this.getEmployee(phone)

        if (employee) {
            logger.debug('User identified as employee')
            return employee
        }

        logger.debug('User identified as client')

        return this.getOrCreateClient(phone)
    }

    private getHandlerForUser(user: Client | Employee): MessageHandler {
        if (isClient(user)) {
            logger.debug('Using client message handler')

            return this.messageHandlers.clientMessageHandler
        }

        if (isEmployee(user)) {
            logger.debug('Using employee message handler')

            return this.messageHandlers.employeeMessageHandler
        }

        logger.error(`Invalid user type: ${typeof user}`)

        throw new Error('Invalid user type')
    }
}
