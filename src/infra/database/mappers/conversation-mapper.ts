import { AgentType, UserType } from '@/@types'
import { Conversation } from '@/entities/conversation'
import {
	fromPrismaStateName,
	toPrismaStateName,
} from '@/infra/database/utils/enumTypeMapping'
import {
	Conversation as PrismaConversation,
	Message as PrismaMessage,
} from '@prisma/client'
import { fromPrismaUserType } from '../utils/enumTypeMapping'
import { MessageMapper } from './message-mapper'

export class ConversationMapper {
	static toEntity(
		raw: PrismaConversation,
		rawMessages: PrismaMessage[] = []
	): Conversation {
		const companyId: string = raw.companyId
		const startedAt: Date = raw.startedAt
		const endedAt: Nullable<Date> = raw.endedAt
		const lastStateChange: Nullable<Date> = raw.lastStateChange
		const agentId: Nullable<string> = raw.agentId
		const resume: Nullable<string> = raw.resume
		const intentTags: Nullable<string[]> = raw.intentTags
			? (raw.intentTags as any)
			: null
		let userId: string
		let agentType: Nullable<AgentType> = null

		if (agentId) {
			if (raw.agentType === 'EMPLOYEE') {
				agentType = AgentType.EMPLOYEE
			}
			if (raw.agentType === 'AI') {
				agentType = AgentType.AI
			}
		}

		if (raw.userType === 'CLIENT' && raw.clientId) {
			userId = raw.clientId
		} else if (raw.userType === 'EMPLOYEE' && raw.employeeId) {
			userId = raw.employeeId
		} else {
			throw new Error('Invalid user type')
		}

		const conversation = Conversation.create(
			{
				companyId,
				userId,
				startedAt,
				endedAt,
				lastStateChange,
				agentId,
				agentType,
				resume,
				userType: fromPrismaUserType(raw.userType),
				state: fromPrismaStateName(raw.currentState),
				stateMetadata: raw.stateData,
				entryActionExecuted: raw.entryActionExecuted,
				aiResponseTrack: raw.aiResponseTrack,
				tokensCount: raw.tokensCount,
				intentTags,
				messages: rawMessages.map(MessageMapper.toEntity),
			},
			raw.id
		)

		return conversation
	}

	static toModel(entity: Conversation): Omit<PrismaConversation, 'id'> {
		const isEmployee = entity.userType === UserType.EMPLOYEE

		return {
			userType: isEmployee ? 'EMPLOYEE' : 'CLIENT',
			clientId: isEmployee ? null : entity.userId,
			employeeId: isEmployee ? entity.userId : null,
			agentType:
				entity.agentType === AgentType.AI
					? 'AI'
					: entity.agentType === AgentType.EMPLOYEE
						? 'EMPLOYEE'
						: null,
			agentId:
				entity.agentType !== AgentType.AI &&
				entity.agentType === AgentType.EMPLOYEE
					? entity.agentId
					: null,
			companyId: entity.companyId,
			currentState: toPrismaStateName(entity.state),
			stateData: null,
			createdAt: entity.startedAt,
			updatedAt: new Date(),
			startedAt: entity.startedAt,
			endedAt: entity.endedAt,
			lastStateChange: entity.lastStateChange,
			resume: entity.resume,
			entryActionExecuted: entity.entryActionExecuted,
			queuedAt: entity.queuedAt,
			firstHumanResponseAt: entity.firstHumanResponseAt,
			closeReason: entity.closeReason,
			referredQueueId: entity.referredQueueId,
			aiResponseTrack: entity.aiResponseTrack,
			tokensCount: entity.tokensCount,
			intentTags: entity.intentTags,
		}
	}
}
