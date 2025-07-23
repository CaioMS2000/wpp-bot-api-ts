import { AggregateRoot } from '@/core/entities/aggregate-root'
import { logger } from '@/core/logger'
import { AgentType, UserType } from '../whats-app/@types'
import { ConversationState } from '../whats-app/application/states/conversation-state'
import type { Message } from './message'

export type ConversationProps = {
	companyId: string
	userType: UserType
	userId: string
	startedAt: Date
	endedAt: Nullable<Date>
	lastStateChange: Nullable<Date>
	agentType: Nullable<AgentType>
	agentId: Nullable<string>
	messages: Message[]
	currentState: ConversationState
	resume: Nullable<string>
}

export type CreateConversationInput = RequireOnly<
	ConversationProps,
	'userId' | 'companyId' | 'userType'
>

export class Conversation extends AggregateRoot<ConversationProps> {
	private static readonly TEMPORARY_STATE = Symbol(
		'TEMPORARY_STATE'
	) as unknown as ConversationState
	static create(props: CreateConversationInput, id?: string) {
		const temporaryState = Conversation.TEMPORARY_STATE
		const state = props.currentState || temporaryState
		const defaults: Omit<
			ConversationProps,
			'userId' | 'companyId' | 'userType'
		> = {
			startedAt: new Date(),
			lastStateChange: new Date(),
			endedAt: null,
			resume: null,
			currentState: state,
			messages: [],
			agentId: null,
			agentType: null,
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
		const transition = this.currentState.handleMessage(message)

		return transition
	}

	transitionToState(newState: ConversationState): void {
		this.props.currentState = newState
		this.props.lastStateChange = new Date()
	}

	upsertAgent(agent: AgentType, agentId = 'invalid-id') {
		if (agent === AgentType.AI) {
			this.props.agentType = AgentType.AI
			this.props.agentId = null
		} else if (agent === AgentType.EMPLOYEE && agentId !== 'invalid-id') {
			this.props.agentType = AgentType.EMPLOYEE
			this.props.agentId = agentId
		} else {
			throw new Error('Invalid agent type')
		}
	}

	get userType() {
		return this.props.userType
	}

	get startedAt() {
		return this.props.startedAt
	}

	get endedAt() {
		return this.props.endedAt
	}

	get messages() {
		return this.props.messages
	}

	get isActive() {
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

	get companyId() {
		return this.props.companyId
	}

	get userId() {
		return this.props.userId
	}

	get agentType() {
		return this.props.agentType
	}

	get agentId() {
		return this.props.agentId
	}

	set currentState(state: ConversationState) {
		this.props.currentState = state
	}

	set endedAt(endedAt: Nullable<Date>) {
		this.props.endedAt = endedAt
	}
}
