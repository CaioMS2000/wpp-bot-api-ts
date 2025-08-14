import { ConversationService } from '@/modules/whats-app/services/conversation-service'
import { ParseChatUseCase } from './parse-chat-use-case'

export class GetRecentChatsUseCase {
	constructor(
		private conversationService: ConversationService,
		private parseChatUseCase: ParseChatUseCase
	) {}

	async execute(companyId: string, limit = 10) {
		const conversations =
			await this.conversationService.getRecentBelongingToClient(
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
