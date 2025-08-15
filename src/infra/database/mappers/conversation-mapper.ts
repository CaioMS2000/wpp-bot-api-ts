import {
	Conversation as PrismaConversation,
	Client as PrismaClient,
	Employee as PrismaEmployee,
	Company as PrismaCompany,
	Manager as PrismaManager,
	BusinessHour as PrismaBusinessHour,
	Message as PrismaMessage,
	UserType as PrismaUserType,
	AgentType as PrismaAgentType,
	StateName as PrismaStateName,
} from 'ROOT/prisma/generated'
import { Conversation } from '@/entities/conversation'
import { AgentType, UserType } from '@/@types'
import { CompanyMapper } from './company-mapper'
import { ClientMapper } from './client-mapper'
import { EmployeeMapper } from './employee-mapper'
import { MessageMapper } from './message-mapper'
import { Employee } from '@/entities/employee'
import { Company } from '@/entities/company'
import {
	fromPrismaStateName,
	toPrismaStateName,
} from '@/infra/database/utils/enumTypeMapping'
import { fromPrismaUserType } from '../utils/enumTypeMapping'

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
			queuedAt: null,
			firstHumanResponseAt: null,
			closeReason: null,
		}
	}
}
