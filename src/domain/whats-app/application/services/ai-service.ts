import { Conversation } from '@/domain/entities/conversation'
import { Message } from '@/domain/entities/message'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'

export abstract class AIService {
	constructor(protected conversationRepository: ConversationRepository) {}

	abstract makeResponse(
		conversation: Conversation,
		message: Message
	): Promise<Message>
}
