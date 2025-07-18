import { prisma } from '@/lib/prisma'
import { Message } from '@/domain/entities/message'
import { MessageRepository } from '@/domain/repositories/message-repository'
import { MessageMapper } from '../../mappers/message-mapper'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'

export class PrismaMessageRepository extends MessageRepository {
    private _conversationRepository!: ConversationRepository

    set conversationRepository(conversationRepository: ConversationRepository) {
        this._conversationRepository = conversationRepository
    }

    get conversationRepository() {
        return this._conversationRepository
    }

    async save(message: Message): Promise<void> {
        const data = MessageMapper.toModel(message)

        await prisma.message.upsert({
            where: { id: message.id },
            update: data,
            create: {
                ...data,
                id: message.id,
            },
        })

        const conversation = await this.conversationRepository.findOrThrow(
            message.conversationId
        )
        message.conversation = conversation
    }
}
