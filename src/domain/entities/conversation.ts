import { Entity } from '@/core/entities/entity'
import { Client } from './client'
import type { Message } from './message'
import { ConversationState } from '../whats-app/application/states/conversation-state'
import { InitialMenuState } from '../whats-app/application/states/initial-menu-state'
import { MenuOption } from '../whats-app/@types'
import { StateTransition } from '../whats-app/application/states/state-transition'

export type ConversationProps = {
    client: Client
    startedAt: Date
    endedAt: Nullable<Date>
    lastStateChange: Nullable<Date>
    agent: Nullable<'employee' | 'AI'>
    participants: any[]
    messages: Message[]
    currentState: ConversationState
}

export class Conversation extends Entity<ConversationProps> {
    static create(
        props: RequireOnly<ConversationProps, 'client'>,
        id?: string
    ) {
        const temporaryState = null as unknown as ConversationState
        const state = props.currentState || temporaryState
        const defaults: Pick<
            ConversationProps,
            | 'startedAt'
            | 'lastStateChange'
            | 'endedAt'
            | 'agent'
            | 'currentState'
        > = {
            startedAt: new Date(),
            lastStateChange: new Date(),
            endedAt: null,
            agent: null,
            currentState: state,
        }

        const conversation = new Conversation(
            {
                ...defaults,
                ...props,
                messages: props.messages ?? [],
                participants: props.participants ?? [],
            },
            id
        )

        conversation.props.currentState = new InitialMenuState(conversation)

        return conversation
    }

    processMessage(messageContent: string) {
        const transition = this.currentState.handleMessage(messageContent)

        return transition
    }

    transitionToState(newState: ConversationState): void {
        this.props.currentState = newState
        this.props.lastStateChange = new Date()
    }

    get client() {
        return this.props.client
    }

    get startedAt() {
        return this.props.startedAt
    }

    get endedAt() {
        return this.props.endedAt
    }

    get agent() {
        return this.props.agent
    }

    get participants() {
        return this.props.participants
    }

    get messages() {
        return this.props.messages
    }

    get active() {
        return Boolean(this.props.endedAt)
    }

    get currentState() {
        return this.props.currentState
    }
}
