import { logger } from '@/core/logger'
import { Client } from '@/domain/entities/client'
import { Employee } from '@/domain/entities/employee'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { WhatsAppOutputPort } from '@/infra/http/output/whats-app-output-port'
import { isClient, isEmployee } from '@/utils/entity'
import { User, UserType } from '../../@types'
import { MessageHandlerFactory } from '../factory/message-handler-factory'
import { MessageHandler } from '../handler/message-handler'
import { ResolveSenderContextUseCase } from '../use-cases/resolve-sender-context-use-case'

const tempOutput = new WhatsAppOutputPort()
const testPhones = ['556292476996', '556293765723']
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
		messageContent: string,
		userName?: string
	) {
		try {
			logger.debug(
				`Incoming message from ${fromPhone} to ${toPhone}: ${messageContent}`
			)
			const { type, company, client, employee } =
				await this.resolveSenderContextUseCase.execute(
					fromPhone,
					toPhone,
					userName
				)

			if (!testPhones.includes(fromPhone)) {
				return await tempOutput.handle(client ?? employee!, {
					type: 'text',
					content:
						'Nosso atendimento online está passando por manutenção. Em breve retornaremos com mais informações. Agradecemos a compreensão.',
				})
			}

			const user: User = type === 'client' ? client! : employee!
			const messageHandler = this.getHandlerForUser(user)

			await messageHandler.process(company, user, messageContent)

			logger.info('Message processed successfully')
		} catch (error) {
			logger.error('Erro bruto:', error)
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

	private getHandlerForUser(user: User): MessageHandler {
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
