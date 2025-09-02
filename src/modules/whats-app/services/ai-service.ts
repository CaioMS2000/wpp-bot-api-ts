import { Conversation } from '@/entities/conversation'
import { Message } from '@/entities/message'
import { WppIncomingContent } from '../@types/messages'

export abstract class AIService {
	abstract makeResponse(
		conversation: Conversation,
		message: Message,
		wppIncomingContent: WppIncomingContent
	): Promise<Message>
}
