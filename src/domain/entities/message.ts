import { Entity } from '@/core/entities/entity'
import { Client } from './client'
import { Conversation } from './conversation'
import { Employee } from './employee'

export type MessageProps = {
    conversation: Conversation
    timestamp: Date
    from: 'client' | 'employee' | 'AI'
    content: string
    aiResponseId: Nullable<string>
    sender: Nullable<Client | Employee>
}
export type CreateMessageInput = RequireOnly<
    MessageProps,
    'conversation' | 'from' | 'content' | 'sender'
>
export class Message extends Entity<MessageProps> {
    static create(props: CreateMessageInput, id?: string) {
        const defaults: Omit<
            MessageProps,
            'conversation' | 'from' | 'content' | 'sender'
        > = {
            timestamp: new Date(),
            aiResponseId: null,
        }
        const message = new Message({ ...defaults, ...props }, id)
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

    get aiResponseId() {
        return this.props.aiResponseId
    }
}
