import { Company } from '../entities/company'
import { Conversation } from '../entities/conversation'

export abstract class ConversationRepository {
    abstract save(conversation: Conversation): Promise<void>
    abstract findActiveByClientPhone(
        company: Company,
        clientPhone: string
    ): Promise<Nullable<Conversation>>
    abstract findActiveByEmployeePhone(
        company: Company,
        employeePhone: string
    ): Promise<Nullable<Conversation>>
    abstract findActiveByEmployeePhoneOrThrow(
        company: Company,
        employeePhone: string
    ): Promise<Conversation>
    abstract findActiveByClientPhoneOrThrow(
        company: Company,
        clientPhone: string
    ): Promise<Conversation>
}
