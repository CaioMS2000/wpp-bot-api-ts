import { logger } from '@/core/logger'
import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { User } from '../../@types'
import { ProcessEmployeeMessageService } from '../services/process-employee-message-service'
import { MessageHandler } from './message-handler'

export class EmployeeMessageHandler extends MessageHandler {
	constructor(
		private processEmployeeMessageService: ProcessEmployeeMessageService
	) {
		super()
	}

	async process(
		company: Company,
		user: User,
		messageContent: string,
		name?: string
	): Promise<void> {
		if (user instanceof Client) {
			throw new Error('This handler is for employees but you passed a client')
		}
		try {
			logger.debug(
				`Employee handler processing message from ${user.phone}: ${messageContent}`
			)
			await this.processEmployeeMessageService.process(
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
