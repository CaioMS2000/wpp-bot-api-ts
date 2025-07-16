import { Company } from '@/domain/entities/company'
import { Conversation } from '@/domain/entities/conversation'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { StateFactory } from '@/domain/whats-app/application/factory/state-factory'
import { prisma } from '@/lib/prisma'
import { ConversationMapper } from '../../mappers/conversation-mapper'
import { PrismaStateDataParser } from '../../state-data-parser/prisma/prisma-state-data-parser'
import { stateNameToPrismaEnum } from '../../utils/enumTypeMapping'

export class PrismaConversationRepository extends ConversationRepository {
    constructor(private prismaStateDataParser: PrismaStateDataParser) {
        super()
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

    async findActiveByClientPhone(
        company: Company,
        clientPhone: string
    ): Promise<Nullable<Conversation>> {
        const raw = await prisma.conversation.findFirst({
            where: {
                companyId: company.id,
                endedAt: null,
                client: {
                    phone: clientPhone,
                },
            },
            include: {
                client: {
                    include: {
                        company: {
                            include: {
                                manager: true,
                                businessHours: true,
                            },
                        },
                    },
                },
                employee: {
                    include: {
                        company: {
                            include: {
                                manager: true,
                                businessHours: true,
                            },
                        },
                    },
                },
                company: {
                    include: {
                        manager: true,
                        businessHours: true,
                    },
                },
                agent: {
                    include: {
                        company: {
                            include: {
                                manager: true,
                                businessHours: true,
                            },
                        },
                    },
                },
                messages: true,
            },
        })

        if (!raw) return null

        const state = ConversationMapper.toEntity({
            ...raw,
            client: raw.client ?? undefined,
            employee: raw.employee ?? undefined,
            agent: raw.agent ?? undefined,
        })

        state.currentState = this.prismaStateDataParser.restoreState(state, raw)

        return state
    }

    async findActiveByEmployeePhone(
        company: Company,
        employeePhone: string
    ): Promise<Nullable<Conversation>> {
        const raw = await prisma.conversation.findFirst({
            where: {
                companyId: company.id,
                endedAt: null,
                employee: {
                    phone: employeePhone,
                },
            },
            include: {
                client: {
                    include: {
                        company: {
                            include: {
                                manager: true,
                                businessHours: true,
                            },
                        },
                    },
                },
                employee: {
                    include: {
                        company: {
                            include: {
                                manager: true,
                                businessHours: true,
                            },
                        },
                        department: {
                            include: {
                                company: {
                                    include: {
                                        manager: true,
                                        businessHours: true,
                                    },
                                },
                                employees: true,
                                queue: true,
                            },
                        },
                    },
                },
                company: {
                    include: {
                        manager: true,
                        businessHours: true,
                    },
                },
                agent: {
                    include: {
                        company: {
                            include: {
                                manager: true,
                                businessHours: true,
                            },
                        },
                    },
                },
                messages: true,
            },
        })

        if (!raw) return null

        const state = ConversationMapper.toEntity({
            ...raw,
            client: raw.client ?? undefined,
            employee: raw.employee ?? undefined,
            agent: raw.agent ?? undefined,
        })

        state.currentState = this.prismaStateDataParser.restoreState(state, raw)

        return state
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
