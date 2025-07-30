import { Conversation } from '@/domain/entities/conversation'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { User, UserType } from '../../@types'
import { type StateFactory } from '../factory/state-factory'
import {
	StateDataType,
	StateName,
	StateTransitionIntention,
} from '../states/types'
import { GetClientByPhoneUseCase } from '../use-cases/get-client-by-phone-use-case'
import { GetClientUseCase } from '../use-cases/get-client-use-case'
import { GetCompanyUseCase } from '../use-cases/get-company-use-case'
import { GetEmployeeUseCase } from '../use-cases/get-employee-use-case'
import { GetFAQCategoryUseCase } from '../use-cases/get-faq-category-use-case'
import { DepartmentService } from './department-service'

type ParamsOfState<S extends StateName> = Extract<
	StateDataType,
	{ stateName: S }
>['params']

export class StateService {
	constructor(
		private stateFactory: StateFactory,
		private faqRepository: FAQRepository,
		private conversationRepository: ConversationRepository,
		private departmentRepository: DepartmentRepository,
		private getClientUseCase: GetClientUseCase,
		private getClientByPhoneUseCase: GetClientByPhoneUseCase,
		private getEmployeeUseCase: GetEmployeeUseCase,
		private getFAQCategoryUseCase: GetFAQCategoryUseCase,
		private getCompanyUseCase: GetCompanyUseCase,
		private departmentService: DepartmentService
	) {}

	private async resolveUser(
		companyId: string,
		userId: string,
		userType: UserType
	): Promise<User> {
		let user: Nullable<User> = null

		if (userType === UserType.CLIENT) {
			user = await this.getClientUseCase.execute(companyId, userId)
		} else if (userType === UserType.EMPLOYEE) {
			user = await this.getEmployeeUseCase.execute(companyId, userId)
		}

		if (!user) {
			throw new Error('Invalid user')
		}

		return user
	}

	private async resolveConversation(
		companyId: string,
		userId: string,
		userType: UserType
	): Promise<Conversation> {
		let conversation: Nullable<Conversation> = null

		if (userType === UserType.EMPLOYEE) {
			conversation =
				await this.conversationRepository.findActiveByEmployeeOrThrow(
					companyId,
					userId
				)
		} else if (userType === UserType.CLIENT) {
			conversation =
				await this.conversationRepository.findActiveByClientOrThrow(
					companyId,
					userId
				)
		}

		if (!conversation) {
			throw new Error('Invalid conversation')
		}

		return conversation
	}

	async resolveIntention({
		target,
		context,
	}: StateTransitionIntention): Promise<StateDataType> {
		switch (target) {
			case StateName.FAQItemsState: {
				const { userId, userType, categoryId, companyId } = context
				const user = await this.resolveUser(companyId, userId, userType)

				const category = await this.getFAQCategoryUseCase.execute(
					companyId,
					categoryId
				)

				const paramsObject: ParamsOfState<typeof target> = {
					category,
					user,
				}

				return {
					stateName: target,
					params: paramsObject,
				}
			}
			case StateName.FAQCategoriesState: {
				const { userId, userType, companyId } = context
				const categories = await this.faqRepository.findCategories(companyId)
				const user = await this.resolveUser(companyId, userId, userType)
				const paramsObject: ParamsOfState<typeof target> = {
					categories,
					user,
				}

				return {
					stateName: target,
					params: paramsObject,
				}
			}
			case StateName.AIChatState: {
				const { userId, userType, companyId } = context
				const user = await this.resolveUser(companyId, userId, userType)
				const conversation = await this.resolveConversation(
					companyId,
					userId,
					userType
				)
				const paramsObject: ParamsOfState<typeof target> = {
					conversation,
					user,
				}

				return {
					stateName: target,
					params: paramsObject,
				}
			}
			case StateName.InitialMenuState: {
				const { userId, userType, companyId } = context
				const user = await this.resolveUser(companyId, userId, userType)
				const conversation = await this.resolveConversation(
					companyId,
					userId,
					userType
				)
				const company = await this.getCompanyUseCase.execute(companyId)
				const paramsObject: ParamsOfState<typeof target> = {
					conversation,
					user,
					company,
				}

				return {
					stateName: target,
					params: paramsObject,
				}
			}
		}
		switch (target) {
			case StateName.DepartmentChatState: {
				const { clientPhone, departmentId, companyId } = context
				const client = await this.getClientByPhoneUseCase.execute(
					companyId,
					clientPhone
				)
				const department = await this.departmentRepository.findOrThrow(
					companyId,
					departmentId
				)
				const paramsObject: ParamsOfState<typeof target> = {
					client,
					department,
					employee: await this.departmentService.getFirstEmployee(
						companyId,
						departmentId
					),
				}

				return {
					stateName: target,
					params: paramsObject,
				}
			}
			case StateName.DepartmentQueueState: {
				const { clientPhone, departmentId, companyId } = context
				const client = await this.getClientByPhoneUseCase.execute(
					companyId,
					clientPhone
				)
				const department = await this.departmentRepository.findOrThrow(
					companyId,
					departmentId
				)
				const paramsObject: ParamsOfState<typeof target> = {
					client,
					department,
				}

				return {
					stateName: target,
					params: paramsObject,
				}
			}
			case StateName.DepartmentSelectionState: {
				const { clientPhone, companyId } = context
				const client = await this.getClientByPhoneUseCase.execute(
					companyId,
					clientPhone
				)
				const activeDepartments =
					await this.departmentRepository.findAll(companyId)
				const paramsObject: ParamsOfState<typeof target> = {
					activeDepartments,
					client,
				}

				return {
					stateName: target,
					params: paramsObject,
				}
			}
		}
		switch (target) {
			case StateName.ChatWithClientState: {
				const { clientPhone, departmentId, companyId } = context
				const company = await this.getCompanyUseCase.execute(companyId)
				const client = await this.getClientByPhoneUseCase.execute(
					companyId,
					clientPhone
				)
				const department = await this.departmentRepository.findOrThrow(
					companyId,
					departmentId
				)
				const employee = await this.departmentService.getFirstEmployee(
					companyId,
					departmentId
				)
				const paramsObject: ParamsOfState<typeof target> = {
					client,
					company,
					department,
					employee,
				}

				return {
					stateName: target,
					params: paramsObject,
				}
			}
			case StateName.ListDepartmentQueueState: {
				const { departmentId, companyId } = context
				const department = await this.departmentRepository.findOrThrow(
					companyId,
					departmentId
				)
				const employee = await this.departmentService.getFirstEmployee(
					companyId,
					departmentId
				)
				const paramsObject: ParamsOfState<typeof target> = {
					department,
					employee,
				}

				return {
					stateName: target,
					params: paramsObject,
				}
			}
		}
	}

	async createState(intention: StateTransitionIntention) {
		const stateData = await this.resolveIntention(intention)

		return this.stateFactory.create(stateData)
	}
}
