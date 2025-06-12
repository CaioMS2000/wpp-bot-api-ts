import { Message } from '@/domain/entities/message'
import { MessageRepository } from '@/domain/repositories/message-repository'

export class InMemoryMessageRepository extends MessageRepository {
    private data: Record<string, Message> = {}

    async save(message: Message): Promise<void> {
        this.data[message.id] = message
    }
}
