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
import { Conversation } from '@/domain/entities/conversation'
import { AgentType, UserType } from '@/domain/whats-app/@types'
import { CompanyMapper } from './company-mapper'
import { ClientMapper } from './client-mapper'
import { EmployeeMapper } from './employee-mapper'
import { MessageMapper } from './message-mapper'
import { Employee } from '@/domain/entities/employee'
import { Company } from '@/domain/entities/company'
import { ConversationState } from '@/domain/whats-app/application/states/conversation-state'
import { fromPrismaUserType } from '../utils/enumTypeMapping'

export class ConversationMapper {
	static toEntity(raw: PrismaConversation): Conversation {
		const companyId: string = raw.companyId
		const startedAt: Date = raw.startedAt
		const endedAt: Nullable<Date> = raw.endedAt
		const lastStateChange: Nullable<Date> = raw.lastStateChange
		const agentId: Nullable<string> = raw.agentId
		const resume: Nullable<string> = raw.resume
		let userId: string

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
				resume,
				userType: fromPrismaUserType(raw.userType),
			},
			raw.id
		)

		return conversation
	}

	static toModel(entity: Conversation): Omit<PrismaConversation, 'id'> {
		// Verifica se user é Client ou Employee baseado na presença da propriedade 'department'
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
			currentState: entity.currentState.constructor.name
				.replace('State', '')
				.toLowerCase() as PrismaStateName,
			stateData: entity.currentState?.data ?? null,
			createdAt: entity.startedAt,
			updatedAt: new Date(),
			startedAt: entity.startedAt,
			endedAt: entity.endedAt,
			lastStateChange: entity.lastStateChange,
			resume: entity.resume,
		}
	}
}
