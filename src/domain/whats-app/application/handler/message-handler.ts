import { Company } from '@/domain/entities/company'
import { UserType } from '../../@types'

export abstract class MessageHandler {
    abstract process(
        company: Company,
        user: UserType,
        messageContent: string,
        name?: string
    ): Promise<void>
}
