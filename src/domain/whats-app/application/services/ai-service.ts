import { Conversation } from '@/domain/entities/conversation'
import { Message } from '@/domain/entities/message'

export abstract class AIService {
	abstract makeResponse(
		conversation: Conversation,
		message: Message
	): Promise<Message>
}
