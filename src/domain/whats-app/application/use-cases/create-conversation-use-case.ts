import {
    Conversation,
    CreateConversationInput,
} from '@/domain/entities/conversation'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'

export class CreateConversationUseCase {
    constructor(private conversationRepository: ConversationRepository) {}

    async execute(input: CreateConversationInput) {
        const conversation = Conversation.create(input)

        await this.conversationRepository.save(conversation)

        return conversation
    }
}
