import { Message } from '../entities/message'

export abstract class MessageRepository {
    abstract save(message: Message): Promise<void>
}
