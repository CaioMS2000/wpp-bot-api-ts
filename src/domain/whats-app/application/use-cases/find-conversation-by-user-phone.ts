import { ConversationRepository } from '@/domain/repositories/conversation-repository'

export class FindConversationByUserPhoneUseCase {
    constructor(private conversationRepository: ConversationRepository) {}

    async execute(phone: string) {
        let conversation =
            await this.conversationRepository.findActiveByClientPhone(phone)

        if (!conversation) {
            conversation =
                await this.conversationRepository.findActiveByEmployeePhone(
                    phone
                )
        }

        return conversation
    }
}
