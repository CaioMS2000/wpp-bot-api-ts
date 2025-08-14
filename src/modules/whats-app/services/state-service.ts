import { User, UserType } from '@/@types'
import { Conversation } from '@/entities/conversation'
import { ConversationStateType } from '@/states'
import { StateDataType } from '@/states/types'
import { StateParamType } from '@/states/types'
import { FailedToResolveStateError } from '../errors/failed-to-resolve-state'
import { CompanyService } from './company-service'
import { ConversationService } from './conversation-service'
import { DepartmentService } from './department-service'
import { FAQService } from './faq-service'
import { UserService } from './user-service'

export type ParamsOfState<S extends ConversationStateType> = Extract<
	StateDataType,
	{ target: S }
>['data']

export class StateService {
	constructor(
		private faqService: FAQService,
		private departmentService: DepartmentService,
		private userService: UserService,
		private companyService: CompanyService,
		private conversationService: ConversationService
	) {}

	async resolveStateData({
		target,
		context,
	}: StateParamType): Promise<StateDataType> {
		switch (target) {
			case ConversationStateType.LISTING_FAQ_ITEMS: {
				context
				const { userId, userType, categoryId, companyId } = context
				const { user, type } = await this.userService.resolveUser(
					companyId,
					userId,
					userType
				)

				const category = await this.faqService.getCategory(
					companyId,
					categoryId
				)

				const paramsObject: ParamsOfState<typeof target> = {
					category,
					user,
				}

				return {
					target: target,
					data: paramsObject,
				}
			}
			case ConversationStateType.SELECTING_FAQ_CATEGORY: {
				const { userId, userType, companyId } = context
				const categories = await this.faqService.getAllCategories(companyId)
				const { user, type } = await this.userService.resolveUser(
					companyId,
					userId,
					userType
				)
				const paramsObject: ParamsOfState<typeof target> = {
					categories,
					user,
				}

				return {
					target: target,
					data: paramsObject,
				}
			}
			case ConversationStateType.CHATTING_WITH_AI: {
				const { userId, userType, companyId } = context
				const { user, type } = await this.userService.resolveUser(
					companyId,
					userId,
					userType
				)
				const conversation = await this.conversationService.resolveConversation(
					companyId,
					userId,
					userType
				)
				const paramsObject: ParamsOfState<typeof target> = {
					conversation,
					user,
				}

				return {
					target: target,
					data: paramsObject,
				}
			}
			case ConversationStateType.BEGIN: {
				const { userId, userType, companyId } = context
				const { user, type } = await this.userService.resolveUser(
					companyId,
					userId,
					userType
				)
				const conversation = await this.conversationService.resolveConversation(
					companyId,
					userId,
					userType
				)
				const company = await this.companyService.getCompany(companyId, {
					notNull: true,
				})
				const paramsObject: ParamsOfState<typeof target> = {
					conversation,
					user,
					company,
				}

				return {
					target: target,
					data: paramsObject,
				}
			}
			case ConversationStateType.INITIAL_MENU: {
				const { userId, userType, companyId } = context
				const { user, type } = await this.userService.resolveUser(
					companyId,
					userId,
					userType
				)
				const conversation = await this.conversationService.resolveConversation(
					companyId,
					userId,
					userType
				)
				const company = await this.companyService.getCompany(companyId, {
					notNull: true,
				})
				const paramsObject: ParamsOfState<typeof target> = {
					conversation,
					user,
					company,
				}

				return {
					target: target,
					data: paramsObject,
				}
			}
		}
		switch (target) {
			case ConversationStateType.CHATTING_WITH_EMPLOYEE: {
				const { clientPhone, departmentId, companyId } = context
				const client = await this.userService.getClientByPhone(
					companyId,
					clientPhone,
					{ notNull: true }
				)
				const department = await this.departmentService.findDepartment(
					companyId,
					departmentId,
					{ notNull: true }
				)
				const paramsObject: ParamsOfState<typeof target> = {
					client,
					department,
					employee: await this.departmentService.getDepartmentEmployee(
						companyId,
						departmentId
					),
				}

				return {
					target: target,
					data: paramsObject,
				}
			}
			case ConversationStateType.DEPARTMENT_QUEUE: {
				const { clientPhone, departmentId, companyId } = context
				const client = await this.userService.getClientByPhone(
					companyId,
					clientPhone,
					{ notNull: true }
				)
				const department = await this.departmentService.findDepartment(
					companyId,
					departmentId,
					{ notNull: true }
				)
				const paramsObject: ParamsOfState<typeof target> = {
					client,
					department,
				}

				return {
					target: target,
					data: paramsObject,
				}
			}
			case ConversationStateType.SELECTING_DEPARTMENT: {
				const { clientPhone, companyId } = context
				const client = await this.userService.getClientByPhone(
					companyId,
					clientPhone,
					{ notNull: true }
				)
				const activeDepartments =
					await this.departmentService.findAllDepartments(companyId)
				const paramsObject: ParamsOfState<typeof target> = {
					activeDepartments,
					client,
				}

				return {
					target: target,
					data: paramsObject,
				}
			}
		}
		switch (target) {
			case ConversationStateType.CHATTING_WITH_CLIENT: {
				const { clientPhone, departmentId, companyId } = context
				const company = await this.companyService.getCompany(companyId, {
					notNull: true,
				})
				const client = await this.userService.getClientByPhone(
					companyId,
					clientPhone,
					{ notNull: true }
				)
				const department = await this.departmentService.findDepartment(
					companyId,
					departmentId,
					{ notNull: true }
				)
				const employee = await this.departmentService.getDepartmentEmployee(
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
					target: target,
					data: paramsObject,
				}
			}
			case ConversationStateType.LISTING_DEPARTMENT_QUEUE: {
				const { departmentId, companyId } = context
				const department = await this.departmentService.findDepartment(
					companyId,
					departmentId,
					{ notNull: true }
				)
				const employee = await this.departmentService.getDepartmentEmployee(
					companyId,
					departmentId
				)
				const paramsObject: ParamsOfState<typeof target> = {
					department,
					employee,
				}

				return {
					target: target,
					data: paramsObject,
				}
			}
		}

		throw new FailedToResolveStateError()
	}
}
