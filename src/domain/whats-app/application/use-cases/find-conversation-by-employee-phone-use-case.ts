import { ConversationRepository } from '@/domain/repositories/conversation-repository'

export class FindConversationByEmployeePhoneUseCase {
	constructor(private conversationRepository: ConversationRepository) {}

	async execute(companyId: string, phone: string) {
		const conversation =
			await this.conversationRepository.findActiveByEmployeePhone(
				companyId,
				phone
			)

		return conversation
	}
}
