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
import { UserType } from '@/domain/whats-app/@types'
import { CompanyMapper } from './company-mapper'
import { ClientMapper } from './client-mapper'
import { EmployeeMapper } from './employee-mapper'
import { MessageMapper } from './message-mapper'
import { Employee } from '@/domain/entities/employee'

type ConversationWithRelations = PrismaConversation & {
    client?: PrismaClient & {
        company: PrismaCompany & {
            businessHours: PrismaBusinessHour[]
            manager: PrismaManager
        }
    }
    employee?: PrismaEmployee & {
        company: PrismaCompany & {
            businessHours: PrismaBusinessHour[]
            manager: PrismaManager
        }
    }
    agent?: PrismaEmployee & {
        company: PrismaCompany & {
            businessHours: PrismaBusinessHour[]
            manager: PrismaManager
        }
    }
    company: PrismaCompany & {
        businessHours: PrismaBusinessHour[]
        manager: PrismaManager
    }
    messages: PrismaMessage[]
}

export class ConversationMapper {
    static toEntity(raw: ConversationWithRelations): Conversation {
        let user: UserType

        if (raw.client) {
            user = ClientMapper.toEntity(raw.client)
        } else if (raw.employee) {
            user = EmployeeMapper.toEntity(raw.employee)
        } else {
            throw new Error('Conversation must have either client or employee')
        }

        let agent: 'AI' | Employee | null = null
        if (raw.agentType === 'AI') {
            agent = 'AI'
        } else if (raw.agent) {
            agent = EmployeeMapper.toEntity(raw.agent)
        }

        return Conversation.create(
            {
                user,
                company: CompanyMapper.toEntity(raw.company),
                startedAt: raw.startedAt,
                endedAt: raw.endedAt,
                lastStateChange: raw.lastStateChange,
                agent,
                participants: [], // Será carregado separadamente se necessário
                messages: raw.messages.map(msg => MessageMapper.toEntity(msg)),
                resume: raw.resume,
            },
            raw.id
        )
    }

    static toModel(entity: Conversation): Omit<PrismaConversation, 'id'> {
        // Verifica se user é Client ou Employee baseado na presença da propriedade 'email'
        const isEmployee = 'email' in entity.user

        return {
            userType: isEmployee ? 'EMPLOYEE' : 'CLIENT',
            clientId: isEmployee ? null : entity.user.id,
            employeeId: isEmployee ? entity.user.id : null,
            agentType:
                entity.agent === 'AI' ? 'AI' : entity.agent ? 'EMPLOYEE' : null,
            agentId:
                entity.agent !== 'AI' && entity.agent ? entity.agent.id : null,
            companyId: entity.company.id,
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
