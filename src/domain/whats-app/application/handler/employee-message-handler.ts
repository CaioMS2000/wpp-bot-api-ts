import { logger } from '@/core/logger'
import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { Employee } from '@/domain/entities/employee'
import { Message } from '@/domain/entities/message'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { MessageRepository } from '@/domain/repositories/message-repository'
import { execute } from '@caioms/ts-utils/functions'
import { StateFactory } from '../factory/state-factory'
import {
    ConversationStateConfig,
    conversationStateDefaultConfig,
} from '../states/conversation-state'
import { StateTransition } from '../states/state-transition'
import { CreateConversationUseCase } from '../use-cases/create-conversation-use-case'
import { FindConversationByEmployeePhoneUseCase } from '../use-cases/find-conversation-by-employee-phone-use-case'
import { ListActiveDepartmentsUseCase } from '../use-cases/list-active-departments-use-case'
import { TransferEmployeeToClientConversationUseCase } from '../use-cases/transfer-employee-to-client-conversation-use-case'
import { MessageHandler } from './message-handler'
import { UserType } from '../../@types'

export class EmployeeMessageHandler extends MessageHandler {
    constructor(
        private messageRepository: MessageRepository,
        private conversationRepository: ConversationRepository,
        private faqRepository: FAQRepository,
        private findConversationByEmployeePhoneUseCase: FindConversationByEmployeePhoneUseCase,
        private createConversationUseCase: CreateConversationUseCase,
        private listActiveDepartmentsUseCase: ListActiveDepartmentsUseCase,
        private transferEmployeeToClientConversationUseCase: TransferEmployeeToClientConversationUseCase,
        private config: ConversationStateConfig = conversationStateDefaultConfig
    ) {
        super()
    }

    async process(
        company: Company,
        user: UserType,
        messageContent: string
    ): Promise<void> {
        if (user instanceof Client) {
            throw new Error(
                'This handler is for employees but you passed a client'
            )
        }
        try {
            logger.debug(
                `Employee handler processing message from ${user.phone}: ${messageContent}`
            )
            const [conversationType, conversation] =
                await this.getOrCreateConversation(company, user)
            logger.debug(
                `Using conversation type: ${conversationType} -> ${conversation.id}`
            )

            const newMessage = await this.saveMessage(
                conversation,
                messageContent,
                user
            )

            conversation.messages.push(newMessage)
            await this.conversationRepository.save(conversation)

            if (conversationType === 'new_conversation') {
                logger.debug(
                    "Running 'onEnter' for state:\n",
                    conversation.currentState.constructor.name
                )
                await execute(
                    conversation.currentState.onEnter.bind(
                        conversation.currentState
                    )
                )
            }

            const result = await conversation.processMessage(messageContent)

            if (result.type === 'transition') {
                logger.debug(
                    "Running 'onExit' for state:\n",
                    conversation.currentState.constructor.name
                )
                await execute(
                    conversation.currentState.onExit.bind(
                        conversation.currentState
                    )
                )
                await this.handleTransition(conversation, result)
                logger.debug(
                    "Running 'onEnter' for state:\n",
                    conversation.currentState.constructor.name
                )
                await execute(
                    conversation.currentState.onEnter.bind(
                        conversation.currentState
                    )
                )
            }

            await this.conversationRepository.save(conversation)

            if (conversation.currentState.shouldAutoTransition()) {
                logger.debug('Auto-transitioning...')
                const autoTransition =
                    conversation.currentState.getAutoTransition()
                if (autoTransition && autoTransition.type === 'transition') {
                    logger.debug('will transit to:\n', autoTransition)
                    logger.debug(
                        "Running 'onExit' for state:\n",
                        conversation.currentState.constructor.name
                    )
                    await execute(
                        conversation.currentState.onExit.bind(
                            conversation.currentState
                        )
                    )
                    await this.handleTransition(conversation, autoTransition)
                    logger.debug(
                        "Running 'onEnter' for state:\n",
                        conversation.currentState.constructor.name
                    )
                    await execute(
                        conversation.currentState.onEnter.bind(
                            conversation.currentState
                        )
                    )

                    await this.conversationRepository.save(conversation)
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`${error.message}`)
                logger.debug(error.stack)
            } else {
                logger.debug(error)
            }

            throw error
        }
    }

    private async saveMessage(
        conversation: Conversation,
        content: string,
        sender: Employee
    ): Promise<Message> {
        const message = Message.create({
            conversation,
            timestamp: new Date(),
            from: 'employee',
            content,
            sender,
        })

        await this.messageRepository.save(message)

        logger.debug('Message saved')

        return message
    }

    private async handleTransition(
        conversation: Conversation,
        transition: StateTransition
    ) {
        logger.debug(`Transitioning to ${transition.targetState}`)
        switch (transition.targetState) {
            case 'initial_menu':
                conversation.transitionToState(
                    StateFactory.create('initial_menu', conversation)
                )
                break
            case 'faq_categories':
                const faqCategories = await this.faqRepository.findCategories(
                    conversation.company
                )
                conversation.transitionToState(
                    StateFactory.create(
                        'faq_categories',
                        conversation,
                        faqCategories
                    )
                )
                break
            case 'faq_items':
                if (typeof transition.data !== 'string') {
                    throw new Error('Invalid transition data')
                }

                const faqItems = await this.faqRepository.findItemsByCategory(
                    conversation.company,
                    transition.data
                )

                conversation.transitionToState(
                    StateFactory.create('faq_items', conversation, [
                        transition.data,
                        faqItems,
                    ])
                )
                break
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
        }

        const availableDepartments =
            await this.listActiveDepartmentsUseCase.execute(
                conversation.company
            )

        switch (transition.targetState) {
            case 'department_queue_list':
                if (conversation.user instanceof Client) {
                    throw new Error(
                        'This handler is for employees but you passed a client'
                    )
                }

                if (!conversation.user.department) {
                    throw new Error('This employee has no department')
                }

                const department = this.findDepartment(
                    availableDepartments,
                    conversation.user.department.name
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

    private async getOrCreateConversation(
        company: Company,
        user: Employee
    ): Promise<['new_conversation' | 'recovered_conversation', Conversation]> {
        let conversation =
            await this.findConversationByEmployeePhoneUseCase.execute(
                company,
                user.phone
            )
        let conversationType: Nullable<
            'new_conversation' | 'recovered_conversation'
        > = null

        if (conversation) {
            conversationType = 'recovered_conversation'
        } else {
            conversation = await this.createConversationUseCase.execute({
                user,
                company,
            })
            conversationType = 'new_conversation'
        }

        if (this.config.outputPort) {
            conversation.currentState.outputPort = this.config.outputPort
        }

        return [conversationType, conversation]
    }

    private findDepartment(
        departments: Department[],
        name: string
    ): Department {
        const department = departments.find(dept => dept.name === name)
        if (!department) {
            throw new Error('Department not found')
        }
        return department
    }
}
