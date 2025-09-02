import { User } from '@/@types'
import { Company } from '@/entities/company'
import { Employee } from '@/entities/employee'
import { logger } from '@/logger'
import { WppIncomingContent } from '../@types/messages'
import { ProcessClientMessageService } from '../services/process-client-message-service'
import { MessageHandler } from './message-handler'

export class ClientMessageHandler extends MessageHandler {
	constructor(
		private processClientMessageService: ProcessClientMessageService
	) {
		super()
	}

	async process(
		company: Company,
		user: User,
		messageContent: WppIncomingContent,
		name?: string
	): Promise<void> {
		if (user instanceof Employee) {
			throw new Error('This handler is for clients but you passed an employee')
		}
		try {
			logger.debug(
				`Client handler processing message from ${user.phone}:`,
				messageContent
			)
			await this.processClientMessageService.process(
				company,
				user,
				messageContent,
				name
			)
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`${error.message}`)
				logger.debug(error.stack)
			} else {
				logger.debug(error)
			}

			throw error
		}
	}
}
