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
    senderId: Nullable<string>
}
export type CreateMessageInput = RequireOnly<
    MessageProps,
    'conversation' | 'from' | 'content'
>

export class Message extends Entity<MessageProps> {
    private static readonly TEMPORARY_CONVERSATION = Symbol(
        'TEMPORARY_CONVERSATION'
    ) as unknown as Conversation

    static create(props: CreateMessageInput, id?: string) {
        const defaults: Omit<
            MessageProps,
            'conversation' | 'from' | 'content'
        > = {
            timestamp: new Date(),
            aiResponseId: null,
            sender: null,
            senderId: null,
        }
        const conversation =
            props.conversation ?? Message.TEMPORARY_CONVERSATION
        const message = new Message({ ...defaults, ...props, conversation }, id)
        return message
    }

    get conversation() {
        if (
            this.props.conversation === Message.TEMPORARY_CONVERSATION ||
            !this.props.conversation
        ) {
            throw new Error(
                'Conversation is not set. Use o setter para definir a conversation.'
            )
        }
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

    get sender(): Nullable<Client | Employee> {
        return this.props.sender
    }

    get senderId(): Nullable<string> {
        return this.props.senderId
    }

    get aiResponseId() {
        return this.props.aiResponseId
    }

    set conversation(conversation: Conversation) {
        this.props.conversation = conversation
    }

    set sender(sender: Client | Employee) {
        this.props.sender = sender
        this.props.senderId = sender.id
    }

    set senderId(senderId: string) {
        if (this.props.sender && this.props.sender.id !== senderId) {
            this.props.sender = null
        }

        this.props.senderId = senderId
    }
}
