import { prisma } from '@/lib/prisma'
import { Message } from '@/domain/entities/message'
import { MessageRepository } from '@/domain/repositories/message-repository'
import { MessageMapper } from '../../mapper/message-mapper'

export class PrismaMessageRepository extends MessageRepository {
    async save(message: Message): Promise<void> {
        await prisma.message.upsert({
            where: { id: message.id },
            update: MessageMapper.toModel(message),
            create: MessageMapper.toModel(message),
        })
    }
}
