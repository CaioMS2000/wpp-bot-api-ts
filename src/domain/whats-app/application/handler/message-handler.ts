import { Client } from '@/domain/entities/client'
import { Employee } from '@/domain/entities/employee'

export abstract class MessageHandler {
    abstract process(
        user: Client | Employee,
        messageContent: string
    ): Promise<void>
}
