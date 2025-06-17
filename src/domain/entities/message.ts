import { Entity } from '@/core/entities/entity'
import { Client } from './client'
import { Conversation } from './conversation'
import { Employee } from './employee'

export type MessageProps = {
    conversation: Conversation
    timestamp: Date
    from: 'client' | 'employee' | 'AI'
    content: string
    sender: Client | Employee
}

export class Message extends Entity<MessageProps> {
    static create(props: MessageProps, id?: string) {
        const message = new Message(props, id)
        return message
    }

    get conversation() {
        return this.props.conversation
    }

    get timestamp() {
        return this.props.timestamp
    }

    get from() {
        return this.props.from
    }

    get content() {
        return this.props.content
    }

    get sender() {
        return this.props.sender
    }
}
