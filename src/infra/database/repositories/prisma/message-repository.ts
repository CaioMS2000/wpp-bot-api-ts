import { prisma } from '@/lib/prisma'
import { Message } from '@/domain/entities/message'
import { MessageRepository } from '@/domain/repositories/message-repository'
import { MessageMapper } from '../../mappers/message-mapper'

export class PrismaMessageRepository extends MessageRepository {
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
    }
}
