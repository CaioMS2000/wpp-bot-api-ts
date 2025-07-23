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
import { SenderType } from '@/domain/whats-app/@types'
import { logger } from '@/core/logger'

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

		const dbMessages = conversation.messages.map(message =>
			MessageMapper.toModel(message)
		)

		await Promise.all(
			dbMessages.map(message =>
				prisma.message.upsert({
					where: { id: message.id },
					update: message,
					create: message,
				})
			)
		)

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

		for (const rawMessage of raw.messages) {
			const message = MessageMapper.toEntity(rawMessage)

			conversation.messages.push(message)
		}

		conversation.currentState = await this.prismaStateDataParser.restoreState(
			conversation,
			raw
		)

		return conversation
	}

	async findActiveByClientPhone(
		companyId: string,
		clientPhone: string
	): Promise<Nullable<Conversation>> {
		const allConversations = await prisma.conversation.findMany({})
		const existingConversation = await prisma.conversation.findFirst({
			where: {
				companyId,
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
			logger.error(error)
			return null
		}
	}

	async findActiveByEmployeePhone(
		companyId: string,
		employeePhone: string
	): Promise<Nullable<Conversation>> {
		const existingConversation = await prisma.conversation.findFirst({
			where: {
				companyId,
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
		companyId: string,
		employeePhone: string
	): Promise<Conversation> {
		const conversation = await this.findActiveByEmployeePhone(
			companyId,
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
		companyId: string,
		clientPhone: string
	): Promise<Conversation> {
		const conversation = await this.findActiveByClientPhone(
			companyId,
			clientPhone
		)

		if (!conversation) {
			throw new Error(
				`Active conversation not found for client with phone ${clientPhone}`
			)
		}

		return conversation
	}

	async findActiveByEmployeeOrThrow(
		companyId: string,
		employeeId: string
	): Promise<Conversation> {
		const raw = await prisma.conversation.findFirst({
			where: {
				companyId,
				endedAt: null,
				employeeId,
			},
		})

		if (!raw) {
			throw new Error(
				`Active conversation not found for employee with id ${employeeId}`
			)
		}

		return this.findOrThrow(raw.id)
	}

	async findActiveByClientOrThrow(
		companyId: string,
		clientId: string
	): Promise<Conversation> {
		const raw = await prisma.conversation.findFirst({
			where: {
				companyId,
				endedAt: null,
				clientId,
			},
		})

		if (!raw) {
			throw new Error(
				`Active conversation not found for client with id ${clientId}`
			)
		}

		return this.findOrThrow(raw.id)
	}
}
