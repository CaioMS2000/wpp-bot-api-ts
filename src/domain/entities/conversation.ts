import { Entity } from '@/core/entities/entity'
import { ConversationState } from '../whats-app/application/states/conversation-state'
import { InitialMenuState } from '../whats-app/application/states/initial-menu-state'
import { Client } from './client'
import { Company } from './company'
import { Employee } from './employee'
import type { Message } from './message'

type UserType = Client | Employee

export type ConversationProps = {
    company: Company
    user: UserType
    startedAt: Date
    endedAt: Nullable<Date>
    lastStateChange: Nullable<Date>
    agent: Nullable<Employee | 'AI'>
    participants: Employee[]
    messages: Message[]
    currentState: ConversationState
    aiServiceThreadId: Nullable<string>
    aiServiceThreadResume: Nullable<string>
}

export type CreateConversationInput = RequireOnly<
    ConversationProps,
    'user' | 'company'
>

export class Conversation extends Entity<ConversationProps> {
    static create(props: CreateConversationInput, id?: string) {
        const temporaryState = null as unknown as ConversationState
        const state = props.currentState || temporaryState
        const defaults: Omit<ConversationProps, 'user' | 'company'> = {
            startedAt: new Date(),
            lastStateChange: new Date(),
            endedAt: null,
            agent: null,
            aiServiceThreadId: null,
            aiServiceThreadResume: null,
            currentState: state,
            participants: [],
            messages: [],
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

    addParticipant(participant: Employee) {
        this.props.participants.push(participant)
    }

    upsertAgent(agent: typeof this.props.agent) {
        this.agent = agent

        if (agent instanceof Employee) {
            this.props.participants.push(agent)
        }
    }

    get user() {
        return this.props.user
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

    get lastStateChange() {
        return this.props.lastStateChange
    }

    get aiServiceThreadId() {
        return this.props.aiServiceThreadId
    }

    get aiServiceThreadResume() {
        return this.props.aiServiceThreadResume
    }

    get company() {
        return this.props.company
    }

    set agent(agent: typeof this.props.agent) {
        this.props.agent = agent
    }

    set currentState(state: ConversationState) {
        this.props.currentState = state
    }
}
