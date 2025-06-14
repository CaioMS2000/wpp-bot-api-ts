import { OutputPort } from '@/core/output/output-port'
import { Client } from '@/domain/entities/client'
import { Conversation } from '@/domain/entities/conversation'
import { Employee } from '@/domain/entities/employee'
import { Message } from '@/domain/entities/message'
import { ClientRepository } from '@/domain/repositories/client-repository'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { DepartmentChatState } from '../states/client-only/department-chat-state'
import { FAQCategoriesState } from '../states/faq-categories-state'
import { FAQItemsState } from '../states/faq-items-state'
import { InitialMenuState } from '../states/initial-menu-state'
import { StateTransition } from '../states/state-transition'
import { MessageHandler } from './message-handler'
import { MessageRepository } from '@/domain/repositories/message-repository'
import { DepartmentSelectionState } from '../states/client-only/department-selection-state'
import { DepartmentQueueState } from '../states/client-only/department-queue-state'
import { logger } from '@/core/logger'
import { Department } from '@/domain/entities/department'

export class ClientMessageHandler extends MessageHandler {
    constructor(
        private outputPort: OutputPort,
        private conversationRepository: ConversationRepository,
        public departmentRepository: DepartmentRepository,
        public faqRepository: FAQRepository,
        private messageRepository: MessageRepository,
        private clientRepository: ClientRepository,
        public employeeRepository: EmployeeRepository
    ) {
        super()
    }

    async process(
        user: Client | Employee,
        messageContent: string
    ): Promise<void> {
        if (user instanceof Employee) {
            logger.error('Invalid user type: Employee in ClientMessageHandler')
            throw new Error(
                'This handler is for clients but you passed an employee'
            )
        }

        logger.info(`Processing message from client: ${user.phone}`)
        logger.debug(`Message content: ${messageContent}`)

        let conversation =
            await this.conversationRepository.findActiveByClientPhone(
                user.phone
            )

        if (!conversation) {
            logger.info(`Creating new conversation for client: ${user.phone}`)
            conversation = Conversation.create({
                user,
            })
            await this.conversationRepository.save(conversation)
        }

        await this.saveMessage(conversation, messageContent, 'client', user)
        await this.conversationRepository.save(conversation)

        const messages: string[] = []

        logger.debug(
            `Current conversation state: ${conversation.currentState.constructor.name}`
        )
        const result = conversation.processMessage(messageContent)

        if (result.type === 'transition') {
            logger.debug(`State transition triggered: ${result.targetState}`)
            await this.handleTransition(conversation, result)
        }

        if (conversation.currentState.entryMessage) {
            messages.push(conversation.currentState.entryMessage)
        }

        if (conversation.currentState.shouldAutoTransition()) {
            logger.debug('Auto transition triggered')
            const autoTransition = conversation.currentState.getAutoTransition()
            if (autoTransition && autoTransition.type === 'transition') {
                await this.handleTransition(conversation, autoTransition)

                if (conversation.currentState.entryMessage) {
                    messages.push(conversation.currentState.entryMessage)
                }
            }
        }

        this.outputPort.handle({
            input: messageContent,
            output: { to: conversation.user.phone, messages },
        })

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

        const availableDepartments =
            await this.departmentRepository.findAllActive()

        switch (transition.targetState) {
            case 'initial_menu':
                conversation.transitionToState(
                    new InitialMenuState(conversation)
                )
                break
            case 'faq_categories':
                const faqCategories = await this.faqRepository.findCategories()

                conversation.transitionToState(
                    new FAQCategoriesState(conversation, faqCategories)
                )
                break
            case 'faq_items':
                if (typeof transition.data !== 'string') {
                    logger.error('Invalid transition data for FAQ items')
                    throw new Error('Invalid transition data')
                }

                const faqItems = await this.faqRepository.findItemsByCategory(
                    transition.data
                )

                conversation.transitionToState(
                    new FAQItemsState(conversation, transition.data, faqItems)
                )
                break
            case 'department_selection':
                conversation.transitionToState(
                    new DepartmentSelectionState(
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
                    new DepartmentChatState(conversation, department)
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
}
