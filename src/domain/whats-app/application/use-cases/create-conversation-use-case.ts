import {
    Conversation,
    CreateConversationInput,
} from '@/domain/entities/conversation'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import type { StateFactory } from '../factory/state-factory'

export class CreateConversationUseCase {
    constructor(
        private conversationRepository: ConversationRepository,
        private stateFactory: StateFactory
    ) {}

    async execute(input: CreateConversationInput) {
        const conversation = Conversation.create(input)
        conversation.currentState = this.stateFactory.create(conversation, {
            stateName: 'InitialMenuState',
        })

        await this.conversationRepository.save(conversation)

        return conversation
    }
}
