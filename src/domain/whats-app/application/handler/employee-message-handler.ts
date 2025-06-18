import { logger } from '@/core/logger'
import { OutputPort } from '@/core/output/output-port'
import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { Employee } from '@/domain/entities/employee'
import { Message } from '@/domain/entities/message'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { MessageRepository } from '@/domain/repositories/message-repository'
import { StateFactory } from '../factory/state-factory'
import { StateTransition } from '../states/state-transition'
import { CreateConversationUseCase } from '../use-cases/create-conversation-use-case'
import { FindConversationByUserPhoneUseCase } from '../use-cases/find-conversation-by-user-phone-use-case'
import { ListActiveDepartmentsUseCase } from '../use-cases/list-active-departments-use-case'
import { MessageHandler } from './message-handler'
import { TransferEmployeeToClientConversationUseCase } from '../use-cases/transfer-employee-to-client-conversation-use-case'

export class EmployeeMessageHandler extends MessageHandler {
    constructor(
        private outputPort: OutputPort,
        private messageRepository: MessageRepository,
        private conversationRepository: ConversationRepository,
        private faqRepository: FAQRepository,
        private findConversationByUserPhoneUseCase: FindConversationByUserPhoneUseCase,
        private createConversationUseCase: CreateConversationUseCase,
        private listActiveDepartmentsUseCase: ListActiveDepartmentsUseCase,
        private transferEmployeeToClientConversationUseCase: TransferEmployeeToClientConversationUseCase
    ) {
        super()
    }

    async process(
        company: Company,
        user: Client | Employee,
        messageContent: string
    ): Promise<void> {
        if (user instanceof Client) {
            logger.error('Invalid user type: Client in EmployeeMessageHandler')
            throw new Error(
                'This handler is for employees but you passed a client'
            )
        }

        logger.info(`Processing message from employee: ${user.phone}`)
        logger.debug(`Message content: ${messageContent}`)

        const messages: string[] = []
        const conversation = await this.getOrCreateConversation(company, user)

        await this.saveMessage(conversation, messageContent, 'employee', user)
        await this.conversationRepository.save(conversation)

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

        switch (transition.targetState) {
            case 'initial_menu':
                conversation.transitionToState(
                    StateFactory.create('initial_menu', conversation)
                )
                break
            case 'faq_categories':
                const faqCategories = await this.faqRepository.findCategories()
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

                const faqItems = await this.faqRepository.findItemsByCategory(
                    transition.data
                )

                conversation.transitionToState(
                    StateFactory.create('faq_items', conversation, [
                        transition.data,
                        faqItems,
                    ])
                )
                break
            case 'department_queue_list':
                conversation.transitionToState(
                    StateFactory.create('department_queue_list', conversation)
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
                        client
                    )
                )
                break
        }

        // const availableDepartments =
        //     await this.listActiveDepartmentsUseCase.execute()

        // switch (transition.targetState) {
        // }
    }

    private async getOrCreateConversation(company: Company, user: Employee) {
        let conversation =
            await this.findConversationByUserPhoneUseCase.execute(user.phone)

        if (!conversation) {
            logger.info(`Creating new conversation for employee: ${user.phone}`)
            conversation = await this.createConversationUseCase.execute({
                user,
                company,
            })
        }

        return conversation
    }

    // private findDepartment(
    //     departments: Department[],
    //     name: string
    // ): Department {
    //     const department = departments.find(dept => dept.name === name)
    //     if (!department) {
    //         logger.error(`Department not found: ${name}`)
    //         throw new Error('Department not found')
    //     }
    //     return department
    // }
}
