import { AgentType, CloseReason, UserType } from '@/@types'
import { Entity } from '@/entities/entity'
import { logger } from '@/logger'
import { ConversationStateType } from '@/states'
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
	state: ConversationStateType
	resume: Nullable<string>
	entryActionExecuted: boolean
	stateMetadata: unknown
	queuedAt: Nullable<Date>
	firstHumanResponseAt: Nullable<Date>
	closeReason: Nullable<CloseReason>
	referredQueueId: Nullable<string>
	tokensCount: number
	aiResponseTrack: Nullable<string>
	intentTags: Nullable<string[]>
}

export type CreateConversationInput = RequireOnly<
	ConversationProps,
	'userId' | 'companyId' | 'userType' | 'state'
>

export class Conversation extends Entity<ConversationProps> {
	static create(props: CreateConversationInput, id?: string) {
		const defaults: Omit<
			ConversationProps,
			'userId' | 'companyId' | 'userType' | 'state'
		> = {
			startedAt: new Date(),
			lastStateChange: new Date(),
			endedAt: null,
			resume: null,
			tokensCount: 0,
			messages: [],
			agentId: null,
			agentType: null,
			entryActionExecuted: false,
			stateMetadata: null,
			queuedAt: null,
			firstHumanResponseAt: null,
			closeReason: null,
			referredQueueId: null,
			aiResponseTrack: null,
			intentTags: null,
		}

		const builtProps = {
			...defaults,
			...props,
		} as const

		const conversation = new Conversation(builtProps, id)

		return conversation
	}

	transitionToState(newState: ConversationStateType): void {
		this.props.state = newState
		this.props.lastStateChange = new Date()
		this.markEntryActionExecuted(false)
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

	markEntryActionExecuted(value = true) {
		this.props.entryActionExecuted = value
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
		return this.props.endedAt === null
	}

	get state() {
		return this.props.state
	}

	get lastStateChange() {
		return this.props.lastStateChange
	}

	get resume() {
		return this.props.resume
	}

	set resume(value: Nullable<string>) {
		this.props.resume = value
	}

	get tokensCount() {
		return this.props.tokensCount
	}

	set tokensCount(value: number) {
		this.props.tokensCount = value
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

	get entryActionExecuted() {
		return this.props.entryActionExecuted
	}

	get stateMetadata() {
		return this.props.stateMetadata
	}

	get queuedAt() {
		return this.props.queuedAt
	}

	get firstHumanResponseAt() {
		return this.props.firstHumanResponseAt
	}

	get closeReason() {
		return this.props.closeReason
	}

	get referredQueueId() {
		return this.props.referredQueueId
	}

	get aiResponseTrack() {
		return this.props.aiResponseTrack
	}

	get intentTags() {
		return this.props.intentTags
	}

	set state(state: ConversationStateType) {
		this.props.state = state
	}

	set endedAt(endedAt: Nullable<Date>) {
		this.props.endedAt = endedAt
	}

	set stateMetadata(value: CreateConversationInput['stateMetadata']) {
		this.props.stateMetadata = value
	}

	set aiResponseTrack(value: Nullable<string>) {
		this.props.aiResponseTrack = value
	}

	set agentType(value: Nullable<AgentType>) {
		this.props.agentType = value
	}

	set agentId(value: Nullable<string>) {
		this.props.agentId = value
	}

	set intentTags(value: Nullable<string[]>) {
		this.props.intentTags = value
	}
}
