import { Entity } from "@/core/entities/entity";
import { Client } from "./client";
import type { Message } from "./message";

export type ConversationProps = {
    client: Client
    startedAt: Date
    endedAt: NotDefined<Date>
    agent: 'employee' | 'AI'
    participants: any[]
    messages: Message[]
}

export class Conversation extends Entity<ConversationProps>{
    static create(props: ConversationProps, id?: string){
        const conversation = new Conversation(props, id)
        return conversation
    }

    get client(){
        return this.props.client
    }

    get startedAt(){
        return this.props.startedAt
    }

    get endedAt(){
        return this.props.endedAt
    }

    get agent(){
        return this.props.agent
    }

    get participants(){
        return this.props.participants
    }

    get messages(){
        return this.props.messages
    }

    get active(){
        return Boolean(this.props.endedAt)
    }
}