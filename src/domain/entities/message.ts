import { Entity } from "@/core/entities/entity";
import { Conversation } from "./conversation";

export type MessageProps = {
    conversation: Conversation
    timestamp: Date
    from: 'client' | 'employee' | 'AI'
    content: string
}

export class Message extends Entity<MessageProps>{
    static create(props: MessageProps, id?: string){
        const message = new Message(props, id)
        return message
    }

    get conversation(){
        return this.props.conversation
    }

    get timestamp(){
        return this.props.timestamp
    }

    get from(){
        return this.props.from
    }

    get content(){
        return this.props.content
    }
}