import { Message } from '@/domain/entities/message'

export abstract class MessageRepository {
    abstract save(message: Message): Promise<void>
}
