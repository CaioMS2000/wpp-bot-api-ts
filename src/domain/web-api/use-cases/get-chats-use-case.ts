import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { ParseChatUseCase } from './parse-chat-use-case'

export class GetChatsUseCase {
	constructor(
		private conversationRepository: ConversationRepository,
		private parseChatUseCase: ParseChatUseCase
	) {}

	async execute(companyId: string) {
		const conversations =
			await this.conversationRepository.findAllBelongingToClient(companyId)

		return Promise.all(
			conversations.map(conversation =>
				this.parseChatUseCase.execute(conversation.companyId, conversation.id)
			)
		)
	}
}
