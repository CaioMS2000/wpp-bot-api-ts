import { logger } from '@/core/logger'
import { Conversation } from '@/domain/entities/conversation'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { isClient, isEmployee } from '@/utils/entity'
import { StateFactory } from '../factory/state-factory'
import { DepartmentQueueState } from '../states/client-only/department-queue-state'
import { StateTransition } from '../states/state-transition'
import { InsertClientIntoDepartmentQueue } from '../use-cases/insert-client-into-department-queue'
import { ListActiveDepartmentsUseCase } from '../use-cases/list-active-departments-use-case'
import { ListFAQCategoriesUseCase } from '../use-cases/list-faq-categories-use-case'
import { RemoveClientFromDepartmentQueue } from '../use-cases/remove-client-from-department-queue'
import { TransferEmployeeToClientConversationUseCase } from '../use-cases/transfer-employee-to-client-conversation-use-case'
import { OutputPort } from '@/core/output/output-port'
import { Department } from '@/domain/entities/department'
import { TransitionIntent } from '../factory/types'

export class StateTransitionService {
    constructor(
        private stateFactory: StateFactory,
        private outputPort: OutputPort,
        private departmentRepository: DepartmentRepository,
        private removeClientFromDepartmentQueue: RemoveClientFromDepartmentQueue,
        private listFAQCategoriesUseCase: ListFAQCategoriesUseCase,
        private listActiveDepartmentsUseCase: ListActiveDepartmentsUseCase,
        private insertClientIntoDepartmentQueue: InsertClientIntoDepartmentQueue,
        private transferEmployeeToClientConversationUseCase: TransferEmployeeToClientConversationUseCase
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
                    this.stateFactory.create(
                        'initial_menu',
                        conversation,
                        this.outputPort
                    )
                )
                break
            case 'faq_categories':
                const faqCategories =
                    await this.listFAQCategoriesUseCase.execute(
                        conversation.company
                    )

                conversation.transitionToState(
                    this.stateFactory.create(
                        'faq_categories',
                        conversation,
                        this.outputPort,
                        { categories: faqCategories.map(cat => cat.name) }
                    )
                )
                break
            case 'faq_items':
                if (typeof transition.data !== 'string') {
                    throw new Error('Invalid transition data')
                }

                conversation.transitionToState(
                    this.stateFactory.create(
                        'faq_items',
                        conversation,
                        this.outputPort,
                        { categoryName: transition.data }
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
                        this.stateFactory.create(
                            'department_selection',
                            conversation,
                            this.outputPort,
                            { departments: availableDepartments }
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
                        this.stateFactory.create(
                            'department_chat',
                            conversation,
                            this.outputPort,
                            { department }
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
                            this.outputPort,
                            department
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
                        this.stateFactory.create(
                            'chat_with_client',
                            conversation,
                            this.outputPort,
                            { client }
                        )
                    )
                    break
                case 'department_queue_list':
                    if (!conversation.user.department) {
                        throw new Error('This employee has no department')
                    }
                    if (
                        !transition.data ||
                        !(transition.data instanceof Department)
                    ) {
                        throw new Error('Invalid transition data')
                    }

                    const department =
                        await this.departmentRepository.findByNameOrThrow(
                            conversation.company,
                            transition.data.name
                        )

                    conversation.transitionToState(
                        this.stateFactory.create(
                            'department_queue_list',
                            conversation,
                            this.outputPort,
                            { department }
                        )
                    )
                    break
            }
        }
    }

    async resolveIntent(
        conversation: Conversation,
        intent: TransitionIntent
    ): Promise<StateTransition> {
        switch (intent.target) {
            case 'department_selection': {
                const departments =
                    await this.listActiveDepartmentsUseCase.execute(
                        conversation.company
                    )
                return StateTransition.to('department_selection', {
                    departments,
                })
            }
            case 'faq_categories': {
                const categories = await this.listFAQCategoriesUseCase.execute(
                    conversation.company
                )
                return StateTransition.to('faq_categories', {
                    categories: categories.map(c => c.name),
                })
            }
            case 'chat_with_client': {
                const client =
                    await this.transferEmployeeToClientConversationUseCase.execute(
                        conversation
                    )
                return StateTransition.to('chat_with_client', { client })
            }
            default:
                throw new Error('Invalid intent')
        }
    }
}
