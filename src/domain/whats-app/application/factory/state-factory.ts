import { OutputPort } from '@/core/output/output-port'
import { AIChatState } from '../states/ai-chat-state'
import { DepartmentChatState } from '../states/client-only/department-chat-state'
import { DepartmentQueueState } from '../states/client-only/department-queue-state'
import { DepartmentSelectionState } from '../states/client-only/department-selection-state'
import { ChatWithClientState } from '../states/employee-only/chat-with-client-sate'
import { ListDepartmentQueueState } from '../states/employee-only/list-department-client-queue-state'
import { FAQCategoriesState } from '../states/faq-categories-state'
import { FAQItemsState } from '../states/faq-items-state'
import { InitialMenuState } from '../states/initial-menu-state'
import { StateDataType, StateName } from '../states/types'
import { AIServiceFactory } from './ai-service-factory'
import { RepositoryFactory } from './repository-factory'
import { UseCaseFactory } from './use-case-factory'

export interface StateFactoryDependencies {
	outputPort: OutputPort
	aiServiceFactory: AIServiceFactory
	useCaseFactory?: UseCaseFactory
}

export class StateFactory {
	constructor(private dependencies: StateFactoryDependencies) {}

	setUseCaseFactory(useCaseFactory: UseCaseFactory) {
		this.dependencies.useCaseFactory = useCaseFactory
	}
	create(stateDataType: StateDataType) {
		if (!this.dependencies.useCaseFactory) {
			throw new Error('UseCaseFactory not initialized')
		}

		const { stateName, params } = stateDataType
		switch (stateName) {
			case StateName.InitialMenuState: {
				// const {  } = params
				const { user, company, conversation } = params
				return new InitialMenuState(
					this.dependencies.outputPort,
					user,
					company,
					conversation,
					this.dependencies.useCaseFactory.getStartNextClientConversationUseCase(),
					this.dependencies.useCaseFactory.getGetDepartmentUseCase()
				)
			}
			case StateName.FAQCategoriesState: {
				const { user, categories } = params
				return new FAQCategoriesState(
					this.dependencies.outputPort,
					user,
					categories
				)
			}
			case StateName.FAQItemsState: {
				const { user, category } = params
				return new FAQItemsState(
					this.dependencies.outputPort,
					user,
					category,
					this.dependencies.useCaseFactory.getGetFAQItemsUseCase()
				)
			}
			case StateName.AIChatState: {
				const { user, conversation } = params
				return new AIChatState(
					this.dependencies.outputPort,
					conversation,
					user,
					this.dependencies.aiServiceFactory.createService()
				)
			}
			case StateName.DepartmentSelectionState: {
				const { activeDepartments, client } = params
				return new DepartmentSelectionState(
					this.dependencies.outputPort,
					client,
					activeDepartments,
					this.dependencies.useCaseFactory.getInsertClientIntoDepartmentQueue()
				)
			}
			case StateName.DepartmentChatState: {
				const { client, department, employee } = params
				return new DepartmentChatState(
					this.dependencies.outputPort,
					employee,
					client,
					department
				)
			}
			case StateName.DepartmentQueueState: {
				const { client, department } = params
				return new DepartmentQueueState(
					this.dependencies.outputPort,
					client,
					department,
					this.dependencies.useCaseFactory.getRemoveClientFromDepartmentQueue()
				)
			}
			case StateName.ChatWithClientState: {
				const { client, company, department, employee } = params
				return new ChatWithClientState(
					this.dependencies.outputPort,
					employee,
					department,
					client,
					company,
					this.dependencies.useCaseFactory.getFinishClientAndEmployeeChatUseCase(),
					this.dependencies.useCaseFactory.getRemoveClientFromDepartmentQueue()
				)
			}
			case StateName.ListDepartmentQueueState: {
				const { department, employee } = params
				return new ListDepartmentQueueState(
					this.dependencies.outputPort,
					employee,
					department,
					this.dependencies.useCaseFactory.getGetClientUseCase()
				)
			}
		}
	}
}
