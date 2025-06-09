import { Message } from '@/domain/entities/message'
import { MessageRepository } from '@/domain/repositories/message-repository'

export class InMemoryMessageRepository extends MessageRepository {
    async save(message: Message): Promise<void> {}
}
