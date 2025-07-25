import { Conversation } from '../entities/conversation'

export abstract class ConversationRepository {
	abstract save(conversation: Conversation): Promise<void>
	abstract findOrThrow(id: string): Promise<Conversation>
	abstract findActiveByClientPhone(
		companyId: string,
		clientPhone: string
	): Promise<Nullable<Conversation>>
	abstract findActiveByEmployeePhone(
		companyId: string,
		employeePhone: string
	): Promise<Nullable<Conversation>>
	abstract findActiveByEmployeePhoneOrThrow(
		companyId: string,
		employeePhone: string
	): Promise<Conversation>
	abstract findActiveByClientPhoneOrThrow(
		companyId: string,
		clientPhone: string
	): Promise<Conversation>
	abstract findActiveByEmployeeOrThrow(
		companyId: string,
		employeeId: string
	): Promise<Conversation>
	abstract findActiveByClientOrThrow(
		companyId: string,
		clientId: string
	): Promise<Conversation>
	abstract findAllBelongingToClient(companyId: string): Promise<Conversation[]>
}
