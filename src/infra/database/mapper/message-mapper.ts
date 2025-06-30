import { Conversation } from '@/domain/entities/conversation'
import { Message } from '@/domain/entities/message'
import {
    Client as PrismaClient,
    Company as PrismaCompany,
    Conversation as PrismaConversation,
    Employee as PrismaEmployee,
    Manager as PrismaManager,
    Message as PrismaMessage,
} from 'ROOT/prisma/generated'
import {
    fromDomainToPrisma,
    fromPrismaToDomain,
} from '../utils/enumTypeMapping'
import { ClientMapper } from './client-mapper'
import { CompanyMapper } from './company-mapper'
import { EmployeeMapper } from './employee-mapper'

export class MessageMapper {
    static toEntity(
        model: PrismaMessage & {
            client: PrismaClient | null
            employee: PrismaEmployee | null
        },
        conversation: PrismaConversation,
        company: PrismaCompany & { manager: PrismaManager }
    ): Message {
        const companyEntity = CompanyMapper.toEntity(company)

        const conversationEntity = Conversation.create(
            {
                company: companyEntity,
                user: model.client
                    ? ClientMapper.toEntity(
                          model.client,
                          company,
                          company.manager
                      )
                    : EmployeeMapper.toEntity(
                          model.employee!,
                          company,
                          company.manager
                      ),
            },
            conversation.id
        )

        const sender = model.client
            ? ClientMapper.toEntity(model.client, company, company.manager)
            : model.employee
              ? EmployeeMapper.toEntity(
                    model.employee,
                    company,
                    company.manager
                )
              : (() => {
                    throw new Error('Message sender not found')
                })()

        return Message.create(
            {
                conversation: conversationEntity,
                from: fromPrismaToDomain(model.from), // 👈 AQUI
                timestamp: model.timestamp,
                content: model.content,
                sender,
            },
            model.id
        )
    }

    static toModel(message: Message): PrismaMessage {
        const object = {
            id: message.id,
            conversationId: message.conversation.id,
            from: fromDomainToPrisma(message.from),
            timestamp: message.timestamp,
            content: message.content,
            clientId: message.from === 'client' ? message.sender.id : null,
            employeeId: message.from === 'employee' ? message.sender.id : null,
        }

        return object
    }
}
