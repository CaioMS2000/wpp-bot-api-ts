import { Client } from '@/domain/entities/client'
import { Employee } from '@/domain/entities/employee'
import { MessageHandler } from './message-handler'

export class EmployeeMessageHandler extends MessageHandler {
    async process(
        user: Client | Employee,
        messageContent: string
    ): Promise<void> {
        if (user instanceof Client) {
            throw new Error(
                'This handler is for employees but you passed an client'
            )
        }
    }
}
