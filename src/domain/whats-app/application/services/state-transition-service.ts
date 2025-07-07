import { logger } from '@/core/logger'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { isClient, isEmployee } from '@/utils/entity'
import { StateFactory } from '../factory/state-factory'
import { TransitionIntent } from '../factory/types'
import { DepartmentQueueState } from '../states/client-only/department-queue-state'
import { StateTransition } from '../states/state-transition'
import { GetDepartmentUseCase } from '../use-cases/get-department-use-case'
import { InsertClientIntoDepartmentQueue } from '../use-cases/insert-client-into-department-queue'
import { ListActiveDepartmentsUseCase } from '../use-cases/list-active-departments-use-case'
import { ListFAQCategoriesUseCase } from '../use-cases/list-faq-categories-use-case'
import { RemoveClientFromDepartmentQueue } from '../use-cases/remove-client-from-department-queue'
import { TransferEmployeeToClientConversationUseCase } from '../use-cases/transfer-employee-to-client-conversation-use-case'

export class StateTransitionService {
    constructor(
        private stateFactory: StateFactory,
        private departmentRepository: DepartmentRepository,
        private removeClientFromDepartmentQueue: RemoveClientFromDepartmentQueue,
        private listFAQCategoriesUseCase: ListFAQCategoriesUseCase,
        private listActiveDepartmentsUseCase: ListActiveDepartmentsUseCase,
        private insertClientIntoDepartmentQueue: InsertClientIntoDepartmentQueue,
        private transferEmployeeToClientConversationUseCase: TransferEmployeeToClientConversationUseCase,
        private getDepartmentUseCase: GetDepartmentUseCase
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
                    this.stateFactory.create('initial_menu', conversation)
                )
                return
            case 'faq_categories':
                const faqCategories =
                    await this.listFAQCategoriesUseCase.execute(
                        conversation.company
                    )

                conversation.transitionToState(
                    this.stateFactory.create('faq_categories', conversation, {
                        categories: faqCategories.map(cat => cat.name),
                    })
                )
                return
            case 'faq_items':
                if (
                    !transition.data ||
                    !('categoryName' in transition.data) ||
                    typeof transition.data.categoryName !== 'string'
                ) {
                    throw new Error('Invalid transition data')
                }

                conversation.transitionToState(
                    this.stateFactory.create('faq_items', conversation, {
                        categoryName: transition.data.categoryName,
                    })
                )
                return
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
                            { department }
                        )
                    )

                    break
                }
                case 'department_queue': {
                    logger.debug(
                        'Transitioning to department queue\ntransition object:\n',
                        transition
                    )
                    // if (typeof transition.data !== 'string') {
                    //     throw new Error('Invalid transition data')
                    // }
                    if (
                        !transition.data ||
                        !('department' in transition.data) ||
                        !(transition.data.department instanceof Department)
                    ) {
                        throw new Error('Invalid transition data')
                    }

                    const department =
                        await this.departmentRepository.findByNameOrThrow(
                            conversation.company,
                            transition.data.department.name
                        )

                    conversation.transitionToState(
                        this.stateFactory.create(
                            'department_queue',
                            conversation,
                            { department }
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
                            { client }
                        )
                    )
                    break
                case 'department_queue_list':
                    logger.debug(
                        'handling transition to department queue list\ntransition:\n',
                        transition
                    )
                    if (!conversation.user.department) {
                        throw new Error('This employee has no department')
                    }
                    if (
                        !transition.data ||
                        !('department' in transition.data) ||
                        !(transition.data.department instanceof Department)
                    ) {
                        throw new Error('Invalid transition data')
                    }

                    const department =
                        await this.departmentRepository.findByNameOrThrow(
                            conversation.company,
                            transition.data.department.name
                        )

                    conversation.transitionToState(
                        this.stateFactory.create(
                            'department_queue_list',
                            conversation,
                            { department }
                        )
                    )
                    break
            }
        }
    }

    async resolveIntent(
        conversation: Conversation,
        intent: TransitionIntent,
        messageContent: string
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
            case 'initial_menu': {
                return StateTransition.to('initial_menu')
            }
            case 'ai_chat': {
                return StateTransition.to('ai_chat')
            }
            case 'faq_items': {
                return StateTransition.to('faq_items', {
                    categoryName: messageContent,
                })
            }

            case 'department_queue': {
                const department = await this.getDepartmentUseCase.execute(
                    conversation.company,
                    messageContent
                )
                return StateTransition.to('department_queue', {
                    department,
                })
            }
            case 'department_chat': {
                const department = await this.getDepartmentUseCase.execute(
                    conversation.company,
                    messageContent
                )
                return StateTransition.to('department_chat', {
                    department,
                })
            }
            case 'department_queue_list': {
                if (!isEmployee(conversation.user)) {
                    throw new Error('Only employees can access this intent')
                }
                if (!conversation.user.department) {
                    throw new Error('This employee has no department')
                }
                const department = await this.getDepartmentUseCase.execute(
                    conversation.company,
                    conversation.user.department.name
                )
                return StateTransition.to('department_queue_list', {
                    department,
                })
            }
            default:
                throw new Error('Invalid intent')
        }
    }
}
