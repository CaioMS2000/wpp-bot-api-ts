import { Company } from '@/domain/entities/company'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'

export class FindConversationByClientPhoneUseCase {
    constructor(private conversationRepository: ConversationRepository) {}

    async execute(company: Company, phone: string) {
        const conversation =
            await this.conversationRepository.findActiveByClientPhone(
                company,
                phone
            )

        return conversation
    }
}
