import { OutputPort } from '@/core/output/output-port'
import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { Employee } from '@/domain/entities/employee'

export abstract class MessageHandler {
    abstract process(
        company: Company,
        user: Client | Employee,
        messageContent: string
    ): Promise<void>
}

export type MessageHandlerConfig = {
    outputPort?: Nullable<OutputPort>
}
export const messageHandlerDefaultConfig: MessageHandlerConfig = {
    outputPort: null,
}
