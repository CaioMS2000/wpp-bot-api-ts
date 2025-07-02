import { logger } from '@/core/logger'
import { Conversation } from '@/domain/entities/conversation'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { isClient, isEmployee } from '@/utils/entity'
import { StateFactory } from '../factory/state-factory'
import { DepartmentQueueState } from '../states/client-only/department-queue-state'
import {
    ConversationStateConfig,
    conversationStateDefaultConfig,
} from '../states/conversation-state'
import { StateTransition } from '../states/state-transition'
import { InsertClientIntoDepartmentQueue } from '../use-cases/insert-client-into-department-queue'
import { ListActiveDepartmentsUseCase } from '../use-cases/list-active-departments-use-case'
import { ListFAQCategorieItemsUseCase } from '../use-cases/list-faq-categorie-items-use-case'
import { ListFAQCategoriesUseCase } from '../use-cases/list-faq-categories-use-case'
import { RemoveClientFromDepartmentQueue } from '../use-cases/remove-client-from-department-queue'
import { TransferEmployeeToClientConversationUseCase } from '../use-cases/transfer-employee-to-client-conversation-use-case'

export class StateTransitionService {
    constructor(
        private departmentRepository: DepartmentRepository,
        private removeClientFromDepartmentQueue: RemoveClientFromDepartmentQueue,
        private listFAQCategoriesUseCase: ListFAQCategoriesUseCase,
        private listFAQCategorieItemsUseCase: ListFAQCategorieItemsUseCase,
        private listActiveDepartmentsUseCase: ListActiveDepartmentsUseCase,
        private insertClientIntoDepartmentQueue: InsertClientIntoDepartmentQueue,
        private transferEmployeeToClientConversationUseCase: TransferEmployeeToClientConversationUseCase,
        private config: ConversationStateConfig = conversationStateDefaultConfig
    ) {}
    async handleTransition(
        conversation: Conversation,
        transition: StateTransition
    ) {
        logger.debug(`Transitioning to ${transition.targetState}`)
        switch (transition.targetState) {
            case 'initial_menu':
                if (conversation.currentState instanceof DepartmentQueueState) {
                    await this.removeClientFromDepartmentQueue.execute(
                        conversation.currentState.department,
                        conversation.user
                    )
                }

                conversation.transitionToState(
                    StateFactory.create(
                        'initial_menu',
                        conversation,
                        null,
                        this.config
                    )
                )
                break
            case 'faq_categories':
                const faqCategories =
                    await this.listFAQCategoriesUseCase.execute(
                        conversation.company
                    )

                conversation.transitionToState(
                    StateFactory.create(
                        'faq_categories',
                        conversation,
                        faqCategories,
                        this.config
                    )
                )
                break
            case 'faq_items':
                if (typeof transition.data !== 'string') {
                    throw new Error('Invalid transition data')
                }

                const faqItems =
                    await this.listFAQCategorieItemsUseCase.execute(
                        conversation.company,
                        transition.data
                    )

                conversation.transitionToState(
                    StateFactory.create(
                        'faq_items',
                        conversation,
                        [transition.data, faqItems],
                        this.config
                    )
                )
                break
        }

        if (isClient(conversation.user)) {
            const availableDepartments =
                await this.listActiveDepartmentsUseCase.execute(
                    conversation.company
                )
            switch (transition.targetState) {
                case 'department_selection':
                    conversation.transitionToState(
                        StateFactory.create(
                            'department_selection',
                            conversation,
                            availableDepartments,
                            this.config
                        )
                    )
                    break
                case 'department_chat': {
                    if (typeof transition.data !== 'string') {
                        throw new Error('Invalid transition data')
                    }

                    const department =
                        await this.departmentRepository.findByNameOrThrow(
                            conversation.company,
                            transition.data
                        )

                    conversation.transitionToState(
                        StateFactory.create(
                            'department_chat',
                            conversation,
                            department,
                            this.config
                        )
                    )

                    break
                }
                case 'department_queue': {
                    if (typeof transition.data !== 'string') {
                        throw new Error('Invalid transition data')
                    }

                    const department =
                        await this.departmentRepository.findByNameOrThrow(
                            conversation.company,
                            transition.data
                        )

                    conversation.transitionToState(
                        new DepartmentQueueState(
                            conversation,
                            department,
                            this.config
                        )
                    )

                    await this.insertClientIntoDepartmentQueue.execute(
                        department,
                        conversation.user
                    )
                    break
                }
            }
        }
        if (isEmployee(conversation.user)) {
            switch (transition.targetState) {
                case 'chat_with_client':
                    const client =
                        await this.transferEmployeeToClientConversationUseCase.execute(
                            conversation
                        )
                    conversation.transitionToState(
                        StateFactory.create(
                            'chat_with_client',
                            conversation,
                            client,
                            this.config
                        )
                    )
                    break
                case 'department_queue_list':
                    if (!conversation.user.department) {
                        throw new Error('This employee has no department')
                    }

                    const department =
                        await this.departmentRepository.findByNameOrThrow(
                            conversation.company,
                            transition.data
                        )

                    conversation.transitionToState(
                        StateFactory.create(
                            'department_queue_list',
                            conversation,
                            department
                        )
                    )
                    break
            }
        }
    }
}
