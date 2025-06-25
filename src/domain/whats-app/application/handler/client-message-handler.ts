import { logger } from '@/core/logger'
import { OutputPort } from '@/core/output/output-port'
import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { Employee } from '@/domain/entities/employee'
import { Message } from '@/domain/entities/message'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { MessageRepository } from '@/domain/repositories/message-repository'
import { StateFactory } from '../factory/state-factory'
import { DepartmentQueueState } from '../states/client-only/department-queue-state'
import { InitialMenuState } from '../states/initial-menu-state'
import { StateTransition } from '../states/state-transition'
import { CreateConversationUseCase } from '../use-cases/create-conversation-use-case'
import { FindConversationByClientPhoneUseCase } from '../use-cases/find-conversation-by-client-phone-use-case'
import { InsertClientIntoDepartmentQueue } from '../use-cases/insert-client-into-department-queue'
import { ListActiveDepartmentsUseCase } from '../use-cases/list-active-departments-use-case'
import { ListFAQCategorieItemsUseCase } from '../use-cases/list-faq-categorie-items-use-case'
import { ListFAQCategoriesUseCase } from '../use-cases/list-faq-categories-use-case'
import {
    MessageHandler,
    MessageHandlerConfig,
    messageHandlerDefaultConfig,
} from './message-handler'

export class ClientMessageHandler extends MessageHandler {
    constructor(
        private messageRepository: MessageRepository,
        private conversationRepository: ConversationRepository,
        private listActiveDepartmentsUseCase: ListActiveDepartmentsUseCase,
        private listFAQCategoriesUseCase: ListFAQCategoriesUseCase,
        private listFAQCategorieItemsUseCase: ListFAQCategorieItemsUseCase,
        private createConversationUseCase: CreateConversationUseCase,
        private findConversationByClientPhoneUseCase: FindConversationByClientPhoneUseCase,
        private insertClientIntoDepartmentQueue: InsertClientIntoDepartmentQueue,
        private messageHandlerConfig: MessageHandlerConfig = messageHandlerDefaultConfig
    ) {
        super()
    }

    async process(
        company: Company,
        user: Client | Employee,
        messageContent: string
    ): Promise<void> {
        if (user instanceof Employee) {
            logger.error('Invalid user type: Employee in ClientMessageHandler')
            throw new Error(
                'This handler is for clients but you passed an employee'
            )
        }

        logger.info(
            `Processing message from client: ${user.phone}\nMessage content: ${messageContent}`
        )

        const messages: string[] = []
        const conversation = await this.getOrCreateConversation(company, user)

        await this.saveMessage(conversation, messageContent, 'client', user)
        await this.conversationRepository.save(conversation)

        logger.debug(
            `Current conversation state: ${conversation.currentState.constructor.name}`
        )
        const result = conversation.processMessage(messageContent)

        if (result.type === 'transition') {
            logger.debug(`State transition triggered: ${result.targetState}`)
            await this.handleTransition(conversation, result)
        }

        logger.debug(
            `Conversation state after possible transition: ${conversation.currentState.constructor.name}`
        )

        if (conversation.currentState.entryMessage) {
            messages.push(conversation.currentState.entryMessage)
        }

        await this.conversationRepository.save(conversation)

        if (conversation.currentState.shouldAutoTransition()) {
            logger.debug('Auto transition triggered')
            const autoTransition = conversation.currentState.getAutoTransition()
            if (autoTransition && autoTransition.type === 'transition') {
                await this.handleTransition(conversation, autoTransition)

                logger.debug(
                    `Conversation state after auto trigged transition: ${conversation.currentState.constructor.name}`
                )

                if (conversation.currentState.entryMessage) {
                    messages.push(conversation.currentState.entryMessage)
                }

                await this.conversationRepository.save(conversation)
            }
        }

        this.finish(conversation, messageContent, messages)

        logger.info('Message processing completed successfully')
    }

    private async saveMessage(
        conversation: Conversation,
        content: string,
        from: 'client' | 'employee' | 'AI',
        sender: Client | Employee
    ): Promise<Message> {
        logger.debug(`Saving message from ${from}`)
        const message = Message.create({
            conversation,
            timestamp: new Date(),
            from,
            content,
            sender,
        })

        await this.messageRepository.save(message)

        return message
    }

    private async handleTransition(
        conversation: Conversation,
        transition: StateTransition
    ) {
        logger.debug(`Handling transition to state: ${transition.targetState}`)

        switch (transition.targetState) {
            case 'initial_menu':
                conversation.transitionToState(
                    new InitialMenuState(conversation)
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
                        faqCategories
                    )
                )
                break
            case 'faq_items':
                if (typeof transition.data !== 'string') {
                    logger.error('Invalid transition data for FAQ items')
                    throw new Error('Invalid transition data')
                }

                const faqItems =
                    await this.listFAQCategorieItemsUseCase.execute(
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
        }

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
                        availableDepartments
                    )
                )
                break
            case 'department_chat': {
                if (typeof transition.data !== 'string') {
                    logger.error('Invalid transition data for department chat')
                    throw new Error('Invalid transition data')
                }

                const department = this.findDepartment(
                    availableDepartments,
                    transition.data
                )

                conversation.transitionToState(
                    StateFactory.create(
                        'department_chat',
                        conversation,
                        department
                    )
                )

                break
            }
            case 'department_queue': {
                if (typeof transition.data !== 'string') {
                    logger.error('Invalid transition data for department queue')
                    throw new Error('Invalid transition data')
                }

                const department = this.findDepartment(
                    availableDepartments,
                    transition.data
                )

                conversation.transitionToState(
                    new DepartmentQueueState(conversation, department)
                )

                await this.insertClientIntoDepartmentQueue.execute(
                    department,
                    conversation.user
                )
                break
            }
        }
    }

    private findDepartment(
        departments: Department[],
        name: string
    ): Department {
        const department = departments.find(dept => dept.name === name)
        if (!department) {
            logger.error(`Department not found: ${name}`)
            throw new Error('Department not found')
        }
        return department
    }

    private async getOrCreateConversation(company: Company, user: Client) {
        let conversation =
            await this.findConversationByClientPhoneUseCase.execute(
                company,
                user.phone
            )

        if (!conversation) {
            logger.info(`Creating new conversation for client: ${user.phone}`)
            conversation = await this.createConversationUseCase.execute({
                user,
                company,
            })
        }

        return conversation
    }

    private async finish(
        conversation: Conversation,
        messageContent: string,
        responseMessages: string[]
    ) {
        if (this.messageHandlerConfig.outputPort) {
            this.messageHandlerConfig.outputPort.handle({
                input: messageContent,
                output: {
                    to: conversation.user.phone,
                    messages: responseMessages,
                },
            })
        }
    }
}
