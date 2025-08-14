import { Conversation } from '@/entities/conversation'
import { Message } from '@/entities/message'

export abstract class AIService {
	abstract makeResponse(
		conversation: Conversation,
		message: Message
	): Promise<Message>
}
