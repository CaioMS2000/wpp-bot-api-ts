import { ConversationRepository } from '@/domain/repositories/conversation-repository'

export class FindConversationByClientPhoneUseCase {
	constructor(private conversationRepository: ConversationRepository) {}

	async execute(companyId: string, phone: string) {
		const conversation =
			await this.conversationRepository.findActiveByClientPhone(
				companyId,
				phone
			)

		return conversation
	}
}
