import { logger } from '@/core/logger'
import { Client } from '@/domain/entities/client'
import { Employee } from '@/domain/entities/employee'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { isClient, isEmployee } from '@/utils/entity'
import { MessageHandlerFactory } from '../factory/message-handler-factory'
import { MessageHandler } from '../handler/message-handler'
import { ResolveSenderContextUseCase } from '../use-cases/resolve-sender-context-use-case'

export class WhatsAppMessageService {
    private messageHandlers: Record<string, MessageHandler>

    constructor(
        public departmentRepository: DepartmentRepository,
        public faqRepository: FAQRepository,
        private messageHandlerFactory: MessageHandlerFactory,
        private resolveSenderContextUseCase: ResolveSenderContextUseCase
    ) {
        this.messageHandlers = this.initializeMessageHandlers()
    }

    async processIncomingMessage(
        fromPhone: string,
        toPhone: string,
        messageContent: string
    ) {
        try {
            // console.clear()
            logger.info(
                `Processing new message from ${fromPhone}\nMessage content: ${messageContent}`,
                { pre: '\n\n\n\n\n' }
            )

            const { type, company, client, employee } =
                await this.resolveSenderContextUseCase.execute(
                    fromPhone,
                    toPhone
                )

            const user: Client | Employee =
                type === 'client' ? client! : employee!
            const messageHandler = this.getHandlerForUser(user)

            await messageHandler.process(company, user, messageContent)

            logger.info('Message processed successfully')
        } catch (error) {
            if (error instanceof Error) {
                logger.error(
                    `Erro durante o processamento da mensagem: ${error.message}`
                )
                logger.debug(error.stack)
            } else {
                logger.debug(error)
            }
        }
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
