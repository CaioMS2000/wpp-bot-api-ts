import { AggregateRoot } from '@/core/entities/aggregate-root'
import { Entity } from '@/core/entities/entity'
import { logger } from '@/core/logger'
import { UserType } from '../whats-app/@types'
import { ConversationState } from '../whats-app/application/states/conversation-state'
import { InitialMenuState } from '../whats-app/application/states/initial-menu-state'
import { Company } from './company'
import { Employee } from './employee'
import type { Message } from './message'

export type ConversationProps = {
    company: Company
    companyId: string
    user: UserType
    userId: string
    startedAt: Date
    endedAt: Nullable<Date>
    lastStateChange: Nullable<Date>
    agent: Nullable<Employee | 'AI'>
    agentId: Nullable<string>
    participants: Employee[]
    messages: Message[]
    currentState: ConversationState
    resume: Nullable<string>
}

export type CreateConversationInput = RequireOnly<
    ConversationProps,
    'userId' | 'companyId'
>

export class Conversation extends AggregateRoot<ConversationProps> {
    private static readonly TEMPORARY_STATE = Symbol(
        'TEMPORARY_STATE'
    ) as unknown as ConversationState
    private static readonly TEMPORARY_COMPANY = Symbol(
        'TEMPORARY_COMPANY'
    ) as unknown as Company
    private static readonly TEMPORARY_USER = Symbol(
        'TEMPORARY_USER'
    ) as unknown as UserType
    static create(props: CreateConversationInput, id?: string) {
        const temporaryState = Conversation.TEMPORARY_STATE
        const state = props.currentState || temporaryState
        const defaults: Omit<ConversationProps, 'userId' | 'companyId'> = {
            startedAt: new Date(),
            lastStateChange: new Date(),
            endedAt: null,
            agent: null,
            resume: null,
            currentState: state,
            company: Conversation.TEMPORARY_COMPANY,
            participants: [],
            messages: [],
            user: Conversation.TEMPORARY_USER,
            agentId: null,
        }

        const conversation = new Conversation(
            {
                ...defaults,
                ...props,
            },
            id
        )

        return conversation
    }

    processMessage(message: Message) {
        logger.debug(
            '[Conversation.processMessage] currentState: ',
            this.currentState.constructor.name
        )
        const transition = this.currentState.handleMessage(message)

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
        if (
            this.props.currentState === Conversation.TEMPORARY_STATE ||
            !this.props.currentState
        ) {
            throw new Error(
                'currentState não foi definido. Use o setter para definir o estado atual.'
            )
        }
        return this.props.currentState
    }

    get lastStateChange() {
        return this.props.lastStateChange
    }

    get resume() {
        return this.props.resume
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

    set endedAt(endedAt: Nullable<Date>) {
        this.props.endedAt = endedAt
    }

    set company(company: Company) {
        this.props.company = company
    }

    set user(user: UserType) {
        this.props.user = user
    }
}
