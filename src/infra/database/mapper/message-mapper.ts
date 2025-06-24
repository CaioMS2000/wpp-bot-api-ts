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
import { ClientMapper } from './client-mapper'
import { CompanyMapper } from './company-mapper'
import { EmployeeMapper } from './employee-mapper'

const fromPrismaToDomain = (
    from: 'CLIENT' | 'EMPLOYEE' | 'AI'
): 'client' | 'employee' | 'AI' => {
    return from.toLowerCase() as 'client' | 'employee' | 'AI'
}
const fromDomainToPrisma = (
    from: 'client' | 'employee' | 'AI'
): 'CLIENT' | 'EMPLOYEE' | 'AI' => {
    return from.toUpperCase() as 'CLIENT' | 'EMPLOYEE' | 'AI'
}

export class MessageMapper {
    static toEntity(
        model: PrismaMessage & {
            conversation: PrismaConversation & {
                company: PrismaCompany & { manager: PrismaManager }
            }
            client: PrismaClient | null
            employee: PrismaEmployee | null
        }
    ): Message {
        const company = CompanyMapper.toEntity(model.conversation.company)

        const conversation = Conversation.create(
            {
                company,
                user: model.client
                    ? ClientMapper.toEntity(
                          model.client,
                          model.conversation.company,
                          model.conversation.company.manager
                      )
                    : EmployeeMapper.toEntity(
                          model.employee!,
                          model.conversation.company,
                          model.conversation.company.manager
                      ),
            },
            model.conversation.id
        )

        const sender = model.client
            ? ClientMapper.toEntity(
                  model.client,
                  model.conversation.company,
                  model.conversation.company.manager
              )
            : model.employee
              ? EmployeeMapper.toEntity(
                    model.employee,
                    model.conversation.company,
                    model.conversation.company.manager
                )
              : (() => {
                    throw new Error('Message sender not found')
                })()

        return Message.create(
            {
                conversation,
                from: fromPrismaToDomain(model.from), // 👈 AQUI
                timestamp: model.timestamp,
                content: model.content,
                sender,
            },
            model.id
        )
    }

    static toModel(message: Message): PrismaMessage {
        return {
            id: message.id,
            conversationId: message.conversation.id,
            from: fromDomainToPrisma(message.from),
            timestamp: message.timestamp,
            content: message.content,
            clientId: message.from === 'client' ? message.sender.id : null,
            employeeId: message.from === 'employee' ? message.sender.id : null,
        }
    }
}
