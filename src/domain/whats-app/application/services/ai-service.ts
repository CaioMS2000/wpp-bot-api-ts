import { Conversation } from '@/domain/entities/conversation'
import { Message } from '@/domain/entities/message'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { MessageRepository } from '@/domain/repositories/message-repository'

export abstract class AIService {
    constructor(
        protected messageRepository: MessageRepository,
        protected conversationRepository: ConversationRepository
    ) {}

    abstract makeResponse(
        conversation: Conversation,
        message: Message
    ): Promise<Message>
}
