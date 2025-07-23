import { Client } from '@/domain/entities/client'
import { Conversation } from '@/domain/entities/conversation'
import { Employee } from '@/domain/entities/employee'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { User, UserType } from '@/domain/whats-app/@types'
import { RepositoryFactory } from '@/domain/whats-app/application/factory/repository-factory'
import { StateFactory } from '@/domain/whats-app/application/factory/state-factory'
import { UseCaseFactory } from '@/domain/whats-app/application/factory/use-case-factory'
import { AIChatState } from '@/domain/whats-app/application/states/ai-chat-state'
import { DepartmentChatState } from '@/domain/whats-app/application/states/client-only/department-chat-state'
import { DepartmentQueueState } from '@/domain/whats-app/application/states/client-only/department-queue-state'
import { DepartmentSelectionState } from '@/domain/whats-app/application/states/client-only/department-selection-state'
import { ConversationState } from '@/domain/whats-app/application/states/conversation-state'
import { ChatWithClientState } from '@/domain/whats-app/application/states/employee-only/chat-with-client-sate'
import { ListDepartmentQueueState } from '@/domain/whats-app/application/states/employee-only/list-department-client-queue-state'
import { FAQCategoriesState } from '@/domain/whats-app/application/states/faq-categories-state'
import { FAQItemsState } from '@/domain/whats-app/application/states/faq-items-state'
import { InitialMenuState } from '@/domain/whats-app/application/states/initial-menu-state'
import { StateName } from '@/domain/whats-app/application/states/types'
import { GetClientByPhoneUseCase } from '@/domain/whats-app/application/use-cases/get-client-by-phone-use-case'
import { GetClientUseCase } from '@/domain/whats-app/application/use-cases/get-client-use-case'
import { GetCompanyUseCase } from '@/domain/whats-app/application/use-cases/get-company-use-case'
import { GetDepartmentEmployeeUseCase } from '@/domain/whats-app/application/use-cases/get-department-employee'
import { GetDepartmentUseCase } from '@/domain/whats-app/application/use-cases/get-department-use-case'
import { GetEmployeeUseCase } from '@/domain/whats-app/application/use-cases/get-employee-use-case'
import {
	Prisma,
	Conversation as PrismaConversation,
} from 'ROOT/prisma/generated'
import { z } from 'zod'

export class PrismaStateDataParser {
	private faqRepository!: FAQRepository
	private departmentRepository!: DepartmentRepository
	private getClientUseCase!: GetClientUseCase
	private getEmployeeUseCase!: GetEmployeeUseCase
	private getCompanyUseCase!: GetCompanyUseCase
	private getDepartmentUseCase!: GetDepartmentUseCase
	private getDepartmentEmployeeUseCase!: GetDepartmentEmployeeUseCase
	private getClientByPhoneUseCase!: GetClientByPhoneUseCase

	constructor(
		private stateFactory: StateFactory,
		private repositoryFactory: RepositoryFactory,
		private useCaseFactory: UseCaseFactory
	) {
		this.initializeRepositories()
	}

	private initializeRepositories() {
		this.faqRepository = this.repositoryFactory.getFAQRepository()
		this.departmentRepository = this.repositoryFactory.getDepartmentRepository()
		this.getClientUseCase = this.useCaseFactory.getGetClientUseCase()
		this.getEmployeeUseCase = this.useCaseFactory.getGetEmployeeUseCase()
		this.getCompanyUseCase = this.useCaseFactory.getGetCompanyUseCase()
	}

	private async resolveUser(
		companyId: string,
		userId: string,
		userType: UserType
	): Promise<User> {
		let user: Nullable<User> = null

		if (userType === UserType.CLIENT) {
			user = await this.getClientUseCase.execute(companyId, userId)
		} else if (userType === UserType.EMPLOYEE) {
			user = await this.getEmployeeUseCase.execute(userId)
		}

		if (!user) {
			throw new Error('Invalid user')
		}

		return user
	}

	serialize(conversation: Conversation): NotDefined<Prisma.InputJsonValue> {
		switch (true) {
			case conversation.currentState instanceof AIChatState: {
				return undefined
			}
			case conversation.currentState instanceof DepartmentSelectionState: {
				return undefined
			}
			case conversation.currentState instanceof FAQCategoriesState: {
				return undefined
			}
			case conversation.currentState instanceof InitialMenuState: {
				return undefined
			}
			case conversation.currentState instanceof DepartmentChatState: {
				return { departmentId: conversation.currentState.department.id }
			}
			case conversation.currentState instanceof DepartmentQueueState: {
				return { departmentId: conversation.currentState.department.id }
			}
			case conversation.currentState instanceof ChatWithClientState: {
				return {
					clientPhoneNumber: conversation.currentState.client.phone,
				}
			}
			case conversation.currentState instanceof ListDepartmentQueueState: {
				return { departmentId: conversation.currentState.department.id }
			}
			case conversation.currentState instanceof FAQItemsState: {
				return { categoryName: conversation.currentState.category.name }
			}
			default:
				throw new Error('Invalid state')
		}
	}

	async restoreState(
		conversation: Conversation,
		prismaConversation: PrismaConversation
	): Promise<
		| InitialMenuState
		| AIChatState
		| DepartmentChatState
		| DepartmentQueueState
		| DepartmentSelectionState
		| ChatWithClientState
		| ListDepartmentQueueState
		| FAQItemsState
		| FAQCategoriesState
	> {
		switch (prismaConversation.currentState) {
			case 'initial_menu': {
				const user = await this.resolveUser(
					conversation.companyId,
					conversation.userId,
					conversation.userType
				)
				const company = await this.getCompanyUseCase.execute(
					conversation.companyId
				)

				return this.stateFactory.create({
					stateName: StateName.InitialMenuState,
					params: {
						user,
						company,
						conversation,
					},
				})
			}
			case 'ai_chat': {
				const user = await this.resolveUser(
					conversation.companyId,
					conversation.userId,
					conversation.userType
				)

				return this.stateFactory.create({
					stateName: StateName.AIChatState,
					params: {
						user,
						conversation,
					},
				})
			}
			case 'faq_categories': {
				const user = await this.resolveUser(
					conversation.companyId,
					conversation.userId,
					conversation.userType
				)
				const categories = await this.faqRepository.findCategories(
					conversation.companyId
				)

				return this.stateFactory.create({
					stateName: StateName.FAQCategoriesState,
					params: { user, categories },
				})
			}
			case 'department_selection': {
				const user = await this.resolveUser(
					conversation.companyId,
					conversation.userId,
					conversation.userType
				)

				if (!(user instanceof Client)) {
					throw new Error('Invalid user')
				}

				const activeDepartments = await this.departmentRepository.findAllActive(
					conversation.companyId
				)

				return this.stateFactory.create({
					stateName: StateName.DepartmentSelectionState,
					params: { activeDepartments, client: user },
				})
			}
		}

		if (!this.isJsonObject(prismaConversation.stateData)) {
			throw new Error('Invalid state data format')
		}

		switch (prismaConversation.currentState) {
			case 'faq_items': {
				const user = await this.resolveUser(
					conversation.companyId,
					conversation.userId,
					conversation.userType
				)
				const { categoryName } = this.validateFAQItemsStateData(
					prismaConversation.stateData
				)
				const category = await this.faqRepository.findCategoryByNameOrThrow(
					conversation.companyId,
					categoryName
				)

				return this.stateFactory.create({
					stateName: StateName.FAQItemsState,
					params: { category, user },
				})
			}
			case 'department_queue': {
				const { departmentId } = this.validateDepartmentQueueStateData(
					prismaConversation.stateData
				)
				const user = await this.resolveUser(
					conversation.companyId,
					conversation.userId,
					conversation.userType
				)

				if (!(user instanceof Client)) {
					throw new Error('Invalid user')
				}

				const department = await this.getDepartmentUseCase.execute(
					conversation.companyId,
					departmentId
				)

				return this.stateFactory.create({
					stateName: StateName.DepartmentQueueState,
					params: { department, client: user },
				})
			}
			case 'department_chat': {
				const { departmentId } = this.validateDepartmentChatStateData(
					prismaConversation.stateData
				)
				const user = await this.resolveUser(
					conversation.companyId,
					conversation.userId,
					conversation.userType
				)

				if (!(user instanceof Client)) {
					throw new Error('Invalid user')
				}

				const department = await this.getDepartmentUseCase.execute(
					conversation.companyId,
					departmentId
				)
				const employee = await this.getDepartmentEmployeeUseCase.execute(
					conversation.companyId,
					departmentId
				)

				return this.stateFactory.create({
					stateName: StateName.DepartmentChatState,
					params: {
						client: user,
						department,
						employee,
					},
				})
			}
			case 'department_queue_list': {
				const { departmentId } = this.validateListDepartmentQueueStateData(
					prismaConversation.stateData
				)
				const department = await this.getDepartmentUseCase.execute(
					conversation.companyId,
					departmentId
				)
				const employee = await this.getDepartmentEmployeeUseCase.execute(
					conversation.companyId,
					departmentId
				)

				return this.stateFactory.create({
					stateName: StateName.ListDepartmentQueueState,
					params: { department, employee },
				})
			}
			case 'chat_with_client': {
				const { clientPhoneNumber } = this.validateChatWithClientStateData(
					prismaConversation.stateData
				)
				const user = await this.resolveUser(
					conversation.companyId,
					conversation.userId,
					conversation.userType
				)

				if (!(user instanceof Employee)) {
					throw new Error('Invalid user')
				}

				if (!user.departmentId) {
					throw new Error('Employee has no department')
				}

				const client = await this.getClientByPhoneUseCase.execute(
					conversation.companyId,
					clientPhoneNumber
				)
				const company = await this.getCompanyUseCase.execute(
					conversation.companyId
				)
				const department = await this.getDepartmentUseCase.execute(
					conversation.companyId,
					user.departmentId
				)

				return this.stateFactory.create({
					stateName: StateName.ChatWithClientState,
					params: { client, company, department, employee: user },
				})
			}
		}
	}
	private isJsonValue(value: unknown): value is Prisma.JsonValue {
		return (
			typeof value === 'string' ||
			typeof value === 'number' ||
			typeof value === 'boolean' ||
			value === null ||
			this.isJsonObject(value) ||
			this.isJsonArray(value)
		)
	}

	private isJsonArray(value: unknown): value is Prisma.JsonArray {
		return Array.isArray(value) && value.every(this.isJsonValue.bind(this))
	}

	private isJsonObject(value: unknown): value is Prisma.JsonObject {
		//     return typeof value === 'object' &&
		//         value !== null &&
		//         !Array.isArray(value);
		if (typeof value !== 'object' || value === null || Array.isArray(value)) {
			return false
		}

		return Object.values(value).every(this.isJsonValue)
	}

	private validateFAQItemsStateData(data: Prisma.JsonObject) {
		const schema = z.object({
			categoryName: z.string(),
		})

		return schema.parse(data)
	}

	private validateDepartmentQueueStateData(data: Prisma.JsonObject) {
		const schema = z.object({
			departmentId: z.string(),
		})

		return schema.parse(data)
	}

	private validateDepartmentChatStateData(data: Prisma.JsonObject) {
		const schema = z.object({
			departmentId: z.string(),
		})

		return schema.parse(data)
	}

	private validateListDepartmentQueueStateData(data: Prisma.JsonObject) {
		const schema = z.object({
			departmentId: z.string(),
		})

		return schema.parse(data)
	}

	private validateChatWithClientStateData(data: Prisma.JsonObject) {
		const schema = z.object({
			clientPhoneNumber: z.string(),
		})

		return schema.parse(data)
	}
}
