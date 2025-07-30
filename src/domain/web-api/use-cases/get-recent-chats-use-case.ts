import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { ParseChatUseCase } from './parse-chat-use-case'

export class GetRecentChatsUseCase {
	constructor(
		private conversationRepository: ConversationRepository,
		private parseChatUseCase: ParseChatUseCase
	) {}

	async execute(companyId: string, limit = 10) {
		const conversations =
			await this.conversationRepository.findRecentBelongingToClient(
				companyId,
				limit
			)

		return Promise.all(
			conversations.map(conversation =>
				this.parseChatUseCase.execute(conversation.companyId, conversation.id)
			)
		)
	}
}
