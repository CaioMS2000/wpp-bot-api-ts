import { AgentType, UserType } from '@/@types'
import { NotNullConfig, NotNullParams } from '@/@types/not-null-params'
import { Client } from '@/entities/client'
import { Conversation, CreateConversationInput } from '@/entities/conversation'
import { Employee } from '@/entities/employee'
import { ResourceNotFoundError } from '@/errors/errors/resource-not-found-error'
import { ConversationMapper } from '@/infra/database/mappers/conversation-mapper'
import { MessageMapper } from '@/infra/database/mappers/message-mapper'
import { prisma } from '@/lib/prisma'
import { ConversationStateType } from '@/states'
import { UserType as PrismaUserType } from 'ROOT/prisma/generated'
import { AgentType as PrismaAgentType } from 'ROOT/prisma/generated'
import { CompanyService } from './company-service'
import { DepartmentQueueService } from './department-queue-service'
import { UserService } from './user-service'

export class ConversationService {
	constructor(
		private userService: UserService,
		private companyService: CompanyService,
		private departmentQueueService: DepartmentQueueService
	) {}

	private async loadMessages(conversationId: string) {
		return await prisma.message.findMany({ where: { conversationId } })
	}

	async resolveConversation(
		companyId: string,
		userId: string,
		userType: UserType
	): Promise<Conversation> {
		const { user, type } = await this.userService.resolveUser(
			companyId,
			userId,
			userType
		)
		let conversation: Nullable<Conversation> = null

		if (type === UserType.EMPLOYEE) {
			conversation = await this.findActiveForEmployee(companyId, user)
		} else if (type === UserType.CLIENT) {
			conversation = await this.findActiveForClient(companyId, user)
		}

		if (!conversation) {
			throw new Error('Invalid conversation')
		}

		return conversation
	}

	async createConversation(input: CreateConversationInput) {
		const conversation = Conversation.create(input)
		const isClient = conversation.userType === UserType.CLIENT
		const isEmployee = conversation.userType === UserType.EMPLOYEE
		let clientId: Nullable<string> = null
		let employeeId: Nullable<string> = null
		let agentType: Nullable<PrismaAgentType> = null
		let agentId: Nullable<string> = null

		if (isEmployee) {
			employeeId = conversation.userId
		}

		if (isClient) {
			clientId = conversation.userId
		}

		if (conversation.agentType === AgentType.AI) {
			agentType = 'AI'
			agentId = 'AI'
		}

		if (conversation.agentType === AgentType.EMPLOYEE) {
			agentType = 'EMPLOYEE'
			agentId = conversation.agentId
		}

		await prisma.conversation.create({
			data: {
				clientId,
				employeeId,
				userType: isEmployee ? 'EMPLOYEE' : 'CLIENT',
				agentType,
				agentId,
				companyId: conversation.companyId,
				currentState: isEmployee ? 'BEGIN' : 'SELECTING_DEPARTMENT',
				entryActionExecuted: false,
				id: conversation.id,
				stateData: conversation.stateMetadata ?? undefined,
			},
		})

		return conversation
	}

	async save(conversation: Conversation) {
		const model = ConversationMapper.toModel(conversation)

		await prisma.conversation.update({
			where: {
				id: conversation.id,
				companyId: conversation.companyId,
			},
			data: {
				...model,
				stateData: conversation.stateMetadata ?? undefined,
			},
		})

		return conversation
	}

	async findByClient(
		companyId: string,
		client: Client
	): Promise<Nullable<Conversation>>
	async findByClient(
		companyId: string,
		client: Client,
		config: NotNullConfig
	): Promise<Conversation>
	async findByClient(
		companyId: string,
		client: Client,
		config?: NotNullParams
	) {
		const model = await prisma.conversation.findFirst({
			where: {
				clientId: client.id,
				companyId,
			},
		})

		if (!model) {
			if (config && config.notNull === true) {
				throw new ResourceNotFoundError('Conversation not found')
			}

			return null
		}

		return ConversationMapper.toEntity(model)
	}

	async findByEmployee(
		companyId: string,
		employee: Employee
	): Promise<Nullable<Conversation>>
	async findByEmployee(
		companyId: string,
		employee: Employee,
		config: NotNullConfig
	): Promise<Conversation>
	async findByEmployee(
		companyId: string,
		employee: Employee,
		config?: NotNullParams
	) {
		const model = await prisma.conversation.findFirst({
			where: {
				employeeId: employee.id,
				companyId,
			},
		})

		if (!model) {
			if (config && config.notNull === true) {
				throw new ResourceNotFoundError('Conversation not found')
			}

			return null
		}

		return ConversationMapper.toEntity(model)
	}

	async findActiveForClient(
		companyId: string,
		client: Client
	): Promise<Nullable<Conversation>>
	async findActiveForClient(
		companyId: string,
		client: Client,
		config: NotNullConfig
	): Promise<Conversation>
	async findActiveForClient(
		companyId: string,
		client: Client,
		config?: NotNullParams
	) {
		const model = await prisma.conversation.findFirst({
			where: {
				clientId: client.id,
				companyId,
				endedAt: null,
			},
		})

		if (!model) {
			if (config && config.notNull === true) {
				throw new ResourceNotFoundError('Conversation not found')
			}

			return null
		}

		return ConversationMapper.toEntity(model)
	}

	async findActiveForEmployee(
		companyId: string,
		employee: Employee
	): Promise<Nullable<Conversation>>
	async findActiveForEmployee(
		companyId: string,
		employee: Employee,
		config: NotNullConfig
	): Promise<Conversation>
	async findActiveForEmployee(
		companyId: string,
		employee: Employee,
		config?: NotNullParams
	) {
		const model = await prisma.conversation.findFirst({
			where: {
				employeeId: employee.id,
				companyId,
				endedAt: null,
			},
		})

		if (!model) {
			if (config && config.notNull === true) {
				throw new ResourceNotFoundError('Conversation not found')
			}

			return null
		}

		return ConversationMapper.toEntity(model)
	}

	async finishClientChat(client: Client, conversationId: string) {
		await prisma.conversation.update({
			where: {
				id: conversationId,
				clientId: client.id,
				companyId: client.companyId,
			},
			data: { endedAt: new Date() },
		})
	}

	async startChatWithClient(employee: Employee, departmentId: string) {
		const company = await this.companyService.getCompany(employee.companyId, {
			notNull: true,
		})
		const client = await this.departmentQueueService.getNextClient(
			company,
			departmentId
		)

		if (!client) {
			return null
		}

		const clientConversation = await this.findActiveForClient(
			company.id,
			client,
			{ notNull: true }
		)
		const renewedConversation = Conversation.create(
			{
				companyId: clientConversation.companyId,
				userType: clientConversation.userType,
				userId: clientConversation.userId,
				startedAt: clientConversation.startedAt,
				endedAt: clientConversation.endedAt,
				lastStateChange: clientConversation.lastStateChange,
				agentType: AgentType.EMPLOYEE,
				agentId: employee.id,
				messages: clientConversation.messages,
				state: ConversationStateType.CHATTING_WITH_EMPLOYEE,
				resume: clientConversation.resume,
				entryActionExecuted: clientConversation.entryActionExecuted,
				stateMetadata: { departmentId: employee.departmentId },
			},
			clientConversation.id
		)

		await this.save(renewedConversation)

		await this.departmentQueueService.removeCLientFromQueue(client.id)

		return client
	}

	async getAllBelongingToClient(companyId: string) {
		const models = await prisma.conversation.findMany({
			where: {
				companyId,
				clientId: { not: null },
				employeeId: { equals: null },
			},
		})

		return Promise.all(
			models.map(async c => {
				const messages = await this.loadMessages(c.id)

				return ConversationMapper.toEntity(c, messages)
			})
		)
	}

	async getRecentBelongingToClient(companyId: string, limit: number) {
		const models = await prisma.conversation.findMany({
			where: {
				companyId,
				clientId: { not: null },
				employeeId: null,
			},
			orderBy: { createdAt: 'desc' },
			take: limit,
		})

		return Promise.all(
			models.map(async c => {
				const messages = await this.loadMessages(c.id)

				return ConversationMapper.toEntity(c, messages)
			})
		)
	}

	async getByMonth(companyId: string, date: Date): Promise<Conversation[]> {
		const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
		const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)

		const raw = await prisma.conversation.findMany({
			where: {
				companyId,
				startedAt: {
					gte: startOfMonth,
					lte: endOfMonth,
				},
			},
		})

		return Promise.all(
			raw.map(async c => {
				const messages = await this.loadMessages(c.id)

				return ConversationMapper.toEntity(c, messages)
			})
		)
	}

	async getBetweenDates(
		companyId: string,
		startDate: Date,
		endDate: Date
	): Promise<Conversation[]> {
		const raw = await prisma.conversation.findMany({
			where: {
				companyId,
				startedAt: {
					gte: startDate,
					lt: endDate,
				},
				userType: PrismaUserType.CLIENT,
			},
			include: {
				client: true,
				employee: true,
				messages: {
					orderBy: {
						timestamp: 'asc',
					},
				},
			},
			orderBy: {
				startedAt: 'asc',
			},
		})

		return Promise.all(
			raw.map(async conversation => {
				const entity = ConversationMapper.toEntity(conversation)

				conversation.messages.forEach(message => {
					entity.messages.push(MessageMapper.toEntity(message))
				})

				return entity
			})
		)
	}

	async getConversation(
		companyId: string,
		conversationId: string
	): Promise<Nullable<Conversation>>
	async getConversation(
		companyId: string,
		conversationId: string,
		config: NotNullConfig
	): Promise<Conversation>
	async getConversation(
		companyId: string,
		conversationId: string,
		config?: NotNullParams
	) {
		const model = await prisma.conversation.findUnique({
			where: { id: conversationId, companyId },
		})

		if (!model) {
			if (config && config.notNull === true) {
				throw new ResourceNotFoundError('Conversation not found')
			}

			return null
		}

		const messages = await this.loadMessages(model.id)

		return ConversationMapper.toEntity(model, messages)
	}
}
