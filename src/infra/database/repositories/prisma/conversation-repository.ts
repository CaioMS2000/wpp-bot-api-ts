import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { Conversation } from '@/domain/entities/conversation'
import { Employee } from '@/domain/entities/employee'
import { ClientRepository } from '@/domain/repositories/client-repository'
import { CompanyRepository } from '@/domain/repositories/company-repository'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { prisma } from '@/lib/prisma'
import { ConversationMapper } from '../../mappers/conversation-mapper'
import { MessageMapper } from '../../mappers/message-mapper'
import { PrismaStateDataParser } from '../../state-data-parser/prisma/prisma-state-data-parser'
import { stateNameToPrismaEnum } from '../../utils/enumTypeMapping'

export class PrismaConversationRepository extends ConversationRepository {
    private _prismaStateDataParser!: PrismaStateDataParser
    private _clientRepository!: ClientRepository
    private _employeeRepository!: EmployeeRepository
    private _companyRepository!: CompanyRepository

    set prismaStateDataParser(prismaStateDataParser: PrismaStateDataParser) {
        this._prismaStateDataParser = prismaStateDataParser
    }

    get prismaStateDataParser() {
        return this._prismaStateDataParser
    }

    set clientRepository(clientRepository: ClientRepository) {
        this._clientRepository = clientRepository
    }

    get clientRepository() {
        return this._clientRepository
    }

    set employeeRepository(employeeRepository: EmployeeRepository) {
        this._employeeRepository = employeeRepository
    }

    get employeeRepository() {
        return this._employeeRepository
    }

    set companyRepository(companyRepository: CompanyRepository) {
        this._companyRepository = companyRepository
    }

    get companyRepository() {
        return this._companyRepository
    }

    async save(conversation: Conversation): Promise<void> {
        const data = ConversationMapper.toModel(conversation)
        const stateName =
            stateNameToPrismaEnum[conversation.currentState.constructor.name]

        if (!stateName) {
            throw new Error(
                `State name ${conversation.currentState.constructor.name} not found in stateNameToPrismaEnum`
            )
        }

        await prisma.conversation.upsert({
            where: { id: conversation.id },
            update: {
                ...data,
                currentState: stateName,
                stateData: this.prismaStateDataParser.serialize(conversation),
            },
            create: {
                ...data,
                currentState: stateName,
                stateData: this.prismaStateDataParser.serialize(conversation),
                id: conversation.id,
            },
        })
    }

    async findOrThrow(id: string): Promise<Conversation> {
        const raw = await prisma.conversation.findUnique({
            where: { id },
            include: {
                client: true,
                employee: true,
                messages: true,
            },
        })

        if (!raw) {
            throw new Error(`Conversation with id ${id} not found`)
        }

        const conversation = ConversationMapper.toEntity(raw)
        const company = await this.companyRepository.findOrThrow(raw.companyId)
        conversation.company = company
        let clientUser: Nullable<Client> = null
        let employeeUser: Nullable<Employee> = null

        if (raw.userType === 'CLIENT' && raw.clientId) {
            clientUser = await this.clientRepository.findOrThrow(
                company,
                raw.clientId
            )
        } else if (raw.userType === 'EMPLOYEE' && raw.employeeId) {
            employeeUser = await this.employeeRepository.findOrThrow(
                raw.employeeId
            )
        }

        const resolvedUser = clientUser ?? employeeUser

        if (!resolvedUser) {
            throw new Error(`User not found for conversation ${id}`)
        }

        conversation.user = resolvedUser

        if (raw.agentType === 'EMPLOYEE' && raw.agentId) {
            const employee = await this.employeeRepository.findOrThrow(
                raw.agentId
            )
            conversation.agent = employee
        } else if (raw.agentType === 'AI') {
            conversation.agent = 'AI'
        }

        const inMemoryEmployeeCache: Employee[] = []
        const inMemoryClientCache: Client[] = []

        for (const rawMessage of raw.messages) {
            const message = MessageMapper.toEntity(rawMessage)
            message.conversation = conversation
            let sender: Nullable<Client | Employee> = null

            if (message.from === 'client' && message.senderId) {
                const clientInCache = inMemoryClientCache.find(
                    client => client.id === message.senderId
                )

                if (clientInCache) {
                    sender = clientInCache
                } else {
                    const clientSender =
                        await this.clientRepository.findOrThrow(
                            company,
                            message.senderId
                        )
                    sender = clientSender

                    inMemoryClientCache.push(clientSender)
                }
            }

            if (message.from === 'employee' && message.senderId) {
                const employeeInCache = inMemoryEmployeeCache.find(
                    employee => employee.id === message.senderId
                )

                if (employeeInCache) {
                    sender = employeeInCache
                } else {
                    const employeeSender =
                        await this.employeeRepository.findOrThrow(
                            message.senderId
                        )
                    sender = employeeSender

                    inMemoryEmployeeCache.push(employeeSender)
                }
            }

            if (sender) {
                message.sender = sender
            }

            conversation.messages.push(message)
        }

        conversation.currentState = this.prismaStateDataParser.restoreState(
            conversation,
            raw
        )

        return conversation
    }

    async findActiveByClientPhone(
        company: Company,
        clientPhone: string
    ): Promise<Nullable<Conversation>> {
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                companyId: company.id,
                endedAt: null,
                client: {
                    phone: clientPhone,
                },
            },
        })

        if (!existingConversation) return null

        try {
            const conversation = await this.findOrThrow(existingConversation.id)
            return conversation
        } catch (error) {
            return null
        }
    }

    async findActiveByEmployeePhone(
        company: Company,
        employeePhone: string
    ): Promise<Nullable<Conversation>> {
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                companyId: company.id,
                endedAt: null,
                employee: {
                    phone: employeePhone,
                },
            },
        })

        if (!existingConversation) return null

        try {
            const conversation = await this.findOrThrow(existingConversation.id)
            return conversation
        } catch (error) {
            return null
        }
    }

    async findActiveByEmployeePhoneOrThrow(
        company: Company,
        employeePhone: string
    ): Promise<Conversation> {
        const conversation = await this.findActiveByEmployeePhone(
            company,
            employeePhone
        )

        if (!conversation) {
            throw new Error(
                `Active conversation not found for employee with phone ${employeePhone}`
            )
        }

        return conversation
    }

    async findActiveByClientPhoneOrThrow(
        company: Company,
        clientPhone: string
    ): Promise<Conversation> {
        const conversation = await this.findActiveByClientPhone(
            company,
            clientPhone
        )

        if (!conversation) {
            throw new Error(
                `Active conversation not found for client with phone ${clientPhone}`
            )
        }

        return conversation
    }
}
