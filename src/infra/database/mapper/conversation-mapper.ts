import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { Conversation } from '@/domain/entities/conversation'
import { Employee } from '@/domain/entities/employee'
import { ConversationState } from '@/domain/whats-app/application/states/conversation-state'
import { InitialMenuState } from '@/domain/whats-app/application/states/initial-menu-state'

import {
    Client as PrismaClient,
    Company as PrismaCompany,
    Conversation as PrismaConversation,
    Employee as PrismaEmployee,
    Manager as PrismaManager,
} from 'ROOT/prisma/generated'
import { CompanyMapper } from './company-mapper'
import { EmployeeMapper } from './employee-mapper'
import { ClientMapper } from './client-mapper'

export class ConversationMapper {
    static toEntity(
        model: PrismaConversation & {
            client: PrismaClient | null
            employee: PrismaEmployee | null
            company: PrismaCompany & { manager: PrismaManager }
        }
    ): Conversation {
        const companyModel = model.company
        let entity: NotDefined<Conversation> = undefined

        if (model.userType === 'CLIENT' && model.clientId && model.client) {
            const clientModel = model.client

            entity = Conversation.create({
                user: ClientMapper.toEntity(
                    clientModel,
                    model.company,
                    model.company.manager
                ),
                company: CompanyMapper.toEntity(companyModel),
            })
        } else if (
            model.userType === 'EMPLOYEE' &&
            model.employeeId &&
            model.employee
        ) {
            const employeeModel = model.employee
            entity = Conversation.create({
                user: EmployeeMapper.toEntity(
                    employeeModel,
                    model.company,
                    model.company.manager
                ),
                company: CompanyMapper.toEntity(companyModel),
            })
        }

        if (entity) {
            return entity
        }

        throw new Error('Conversation mapping failed: User type not recognized')
    }
}
