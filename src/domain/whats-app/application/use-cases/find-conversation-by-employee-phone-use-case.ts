import { Company } from '@/domain/entities/company'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'

export class FindConversationByEmployeePhoneUseCase {
    constructor(private conversationRepository: ConversationRepository) {}

    async execute(company: Company, phone: string) {
        const conversation =
            await this.conversationRepository.findActiveByEmployeePhone(
                company,
                phone
            )

        return conversation
    }
}
