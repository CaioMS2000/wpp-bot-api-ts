import { Conversation } from '@/domain/entities/conversation'

import { logger } from '@/core/logger'
import { OutputPort } from '@/core/output/output-port'
import { isClient, isEmployee } from '@/utils/entity'
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

export class StateFactory {
	private repositoryFactory: RepositoryFactory =
		null as unknown as RepositoryFactory
	private useCaseFactory: UseCaseFactory = null as unknown as UseCaseFactory
	constructor(
		private outputPort: OutputPort,
		private aiServiceFactory: AIServiceFactory
	) {}

	setUseCaseFactory(useCaseFactory: UseCaseFactory) {
		this.useCaseFactory = useCaseFactory
	}

	setRepositoryFactory(repositoryFactory: RepositoryFactory) {
		this.repositoryFactory = repositoryFactory
	}

	create(stateDataType: StateDataType) {
		const { stateName, params } = stateDataType
		switch (stateName) {
			case StateName.InitialMenuState: {
				// const {  } = params
				const { user, company, conversation } = params
				return new InitialMenuState(
					this.outputPort,
					user,
					company,
					conversation,
					this.useCaseFactory.getStartNextClientConversationUseCase(),
					this.useCaseFactory.getGetDepartmentUseCase()
				)
			}
			case StateName.FAQCategoriesState: {
				const { user, categories } = params
				return new FAQCategoriesState(this.outputPort, user, categories)
			}
			case StateName.FAQItemsState: {
				const { user, category } = params
				return new FAQItemsState(
					this.outputPort,
					user,
					category,
					this.useCaseFactory.getGetFAQItemsUseCase()
				)
			}
			case StateName.AIChatState: {
				const { user, conversation } = params
				return new AIChatState(
					this.outputPort,
					conversation,
					user,
					this.aiServiceFactory.createService()
				)
			}
			case StateName.DepartmentSelectionState: {
				const { activeDepartments, client } = params
				return new DepartmentSelectionState(
					this.outputPort,
					client,
					activeDepartments,
					this.useCaseFactory.getInsertClientIntoDepartmentQueue()
				)
			}
			case StateName.DepartmentChatState: {
				const { client, department, employee } = params
				return new DepartmentChatState(
					this.outputPort,
					employee,
					client,
					department
				)
			}
			case StateName.DepartmentQueueState: {
				const { client, department } = params
				return new DepartmentQueueState(
					this.outputPort,
					client,
					department,
					this.useCaseFactory.getRemoveClientFromDepartmentQueue()
				)
			}
			case StateName.ChatWithClientState: {
				const { client, company, department, employee } = params
				return new ChatWithClientState(
					this.outputPort,
					employee,
					department,
					client,
					company,
					this.useCaseFactory.getFinishClientAndEmployeeChatUseCase(),
					this.useCaseFactory.getRemoveClientFromDepartmentQueue()
				)
			}
			case StateName.ListDepartmentQueueState: {
				const { department, employee } = params
				return new ListDepartmentQueueState(
					this.outputPort,
					employee,
					department,
					this.useCaseFactory.getGetClientUseCase()
				)
			}
		}
	}
}
