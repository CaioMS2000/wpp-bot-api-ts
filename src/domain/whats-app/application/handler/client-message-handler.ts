import { logger } from '@/core/logger'
import { Company } from '@/domain/entities/company'
import { Employee } from '@/domain/entities/employee'
import { UserType } from '../../@types'
import { MessageHandler } from './message-handler'
import { ProcessClientMessageService } from '../services/process-client-message-service'

export class ClientMessageHandler extends MessageHandler {
    constructor(
        private processClientMessageService: ProcessClientMessageService
    ) {
        super()
    }

    async process(
        company: Company,
        user: UserType,
        messageContent: string,
        name?: string
    ): Promise<void> {
        if (user instanceof Employee) {
            throw new Error(
                'This handler is for clients but you passed an employee'
            )
        }
        try {
            logger.debug(
                `Client handler processing message from ${user.phone}: ${messageContent}`
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
