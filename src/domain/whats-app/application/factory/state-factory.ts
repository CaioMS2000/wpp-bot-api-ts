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
import { StateTypeMapper } from '../states/types'
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

    create(conversation: Conversation, stateTypeMapper: StateTypeMapper) {
        switch (stateTypeMapper.stateName) {
            case 'InitialMenuState':
                return new InitialMenuState(
                    conversation,
                    this.outputPort,
                    this.useCaseFactory.getStartNextClientConversationUseCase()
                )
            case 'FAQCategoriesState':
                return new FAQCategoriesState(
                    conversation,
                    this.outputPort,
                    this.useCaseFactory.getListFAQCategoriesUseCase()
                )
            case 'FAQItemsState':
                return new FAQItemsState(
                    conversation,
                    this.outputPort,
                    this.useCaseFactory.getListFAQCategorieItemsUseCase(),
                    stateTypeMapper.params.categoryName
                )
            case 'AIChatState': {
                return new AIChatState(
                    conversation,
                    this.outputPort,
                    this.aiServiceFactory.createService()
                )
            }
        }

        if (isClient(conversation.user)) {
            switch (stateTypeMapper.stateName) {
                case 'DepartmentSelectionState':
                    return new DepartmentSelectionState(
                        conversation,
                        this.outputPort,
                        this.useCaseFactory.getListActiveDepartmentsUseCase()
                    )
                case 'DepartmentChatState': {
                    return new DepartmentChatState(
                        conversation,
                        this.outputPort,
                        this.repositoryFactory.createDepartmentRepository(),
                        stateTypeMapper.params.departmentId
                    )
                }
                case 'DepartmentQueueState': {
                    return new DepartmentQueueState(
                        conversation,
                        this.outputPort,
                        this.repositoryFactory.createDepartmentRepository(),
                        this.useCaseFactory.getRemoveClientFromDepartmentQueue(),
                        stateTypeMapper.params.departmentId
                    )
                }
            }
        }

        if (isEmployee(conversation.user)) {
            switch (stateTypeMapper.stateName) {
                case 'ChatWithClientState':
                    return new ChatWithClientState(
                        conversation,
                        this.outputPort,
                        stateTypeMapper.params.clientPhoneNumber,
                        this.repositoryFactory.createClientRepository(),
                        this.useCaseFactory.getFinishClientAndEmployeeChatUseCase(),
                        this.useCaseFactory.getRemoveClientFromDepartmentQueue()
                    )
                case 'ListDepartmentQueueState':
                    return new ListDepartmentQueueState(
                        conversation,
                        this.outputPort,
                        this.repositoryFactory.createDepartmentRepository(),
                        stateTypeMapper.params.departmentId
                    )
            }
        }
        throw new Error('Invalid state name')
    }
}
