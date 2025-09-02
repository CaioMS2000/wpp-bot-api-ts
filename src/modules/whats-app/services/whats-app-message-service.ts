import { SenderType, User } from '@/@types'
import { logger } from '@/logger'
import { isClient, isEmployee } from '@/utils/entity'
import { WppIncomingContent } from '../@types/messages'
import { MessageHandlerFactory } from '../factory/message-handler-factory'
import { MessageHandler } from '../handler/message-handler'
import { UserService } from './user-service'

export class WhatsAppMessageService {
	private messageHandlers: Record<string, MessageHandler>

	constructor(
		private messageHandlerFactory: MessageHandlerFactory,
		private userService: UserService
	) {
		this.messageHandlers = this.initializeMessageHandlers()
	}

	async processIncomingMessage(
		fromPhone: string,
		toPhone: string,
		messageContent: WppIncomingContent,
		userName?: string
	) {
		try {
			logger.debug(
				`Incoming message from ${fromPhone} to ${toPhone}:`,
				messageContent
			)
			const { type, company, client, employee } =
				await this.userService.resolveSenderContext(
					fromPhone,
					toPhone,
					userName
				)
			let user: User

			if (type === SenderType.CLIENT) {
				user = client
			} else {
				user = employee
			}

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
