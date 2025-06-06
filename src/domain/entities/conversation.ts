import { Entity } from '@/core/entities/entity'
import { Client } from './client'
import type { Message } from './message'
import { ConversationState } from '../whats-app/application/states/conversation-state'
import { InitialMenuState } from '../whats-app/application/states/initial-menu-state'
import {
    MenuOption,
    MessageProcessingResult,
    ResponseData,
} from '../whats-app/@types'
import { StateTransition } from '../whats-app/application/states/state-transition'

export type ConversationProps = {
    client: Client
    startedAt: Date
    endedAt: Nullable<Date>
    lastStateChange: Nullable<Date>
    agent: 'employee' | 'AI'
    participants: any[]
    messages: Message[]
    currentState: ConversationState
}

export class Conversation extends Entity<ConversationProps> {
    static create(
        props: Optional<
            ConversationProps,
            'startedAt' | 'endedAt' | 'currentState' | 'lastStateChange'
        >,
        id?: string
    ) {
        const temporaryState = null as unknown as ConversationState
        const state = props.currentState || temporaryState
        const conversation = new Conversation(
            {
                ...props,
                startedAt: props.startedAt ?? new Date(),
                lastStateChange: props.lastStateChange ?? new Date(),
                endedAt: props.endedAt ?? null,
                currentState: state,
            },
            id
        )

        conversation.currentState = new InitialMenuState(conversation)

        return conversation
    }

    // Método principal para processar mensagens
    processMessage(messageContent: string): MessageProcessingResult {
        // A entidade delega para o estado atual
        const transition = this.currentState.handleMessage(messageContent)

        return {
            transition,
            currentStateInfo: this.currentState.getStateInfo(),
            requiresExternalData: transition.requiresExternalData,
            responseData: this.buildResponse(transition),
        }
    }

    // Método para transição de estado (chamado pelo Service após obter dados externos)
    transitionToState(newState: ConversationState): void {
        this.currentState = newState
        this.props.lastStateChange = new Date()
    }

    getCurrentMenuOptions(): MenuOption[] {
        return this.currentState.getMenuOptions()
    }

    private buildResponse(transition: StateTransition): ResponseData {
        if (transition.type === 'stay_current') {
            return {
                message:
                    transition.message ||
                    'Opção não reconhecida. Tente novamente:',
                options: this.getCurrentMenuOptions(),
            }
        }

        return {
            message: transition.message || 'Processando...',
            requiresDataFetch: transition.requiresExternalData,
        }
    }

    get client() {
        return this.props.client
    }

    get currentStateName() {
        return this.currentState.getStateInfo().name
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

    set currentState(state: ConversationState) {
        this.props.currentState = state
    }

    set lastStateChange(value: Date) {
        this.props.lastStateChange = value
    }
}
