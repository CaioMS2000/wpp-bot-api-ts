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
import { MessageHandler } from './message-handler'
import {
    ConversationStateConfig,
    conversationStateDefaultConfig,
} from '../states/conversation-state'

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
        private config: ConversationStateConfig = conversationStateDefaultConfig
    ) {
        console.log('[ClientMessageHandler.constructor] config:\n', config)
        super()
    }

    async process(
        company: Company,
        user: Client | Employee,
        messageContent: string
    ): Promise<void> {
        if (user instanceof Employee) {
            throw new Error(
                'This handler is for clients but you passed an employee'
            )
        }

        const conversation = await this.getOrCreateConversation(company, user)

        const newMessage = await this.saveMessage(
            conversation,
            messageContent,
            'client',
            user
        )

        conversation.messages.push(newMessage)
        await this.conversationRepository.save(conversation)

        console.log(
            "i'll run onEnter for: ",
            conversation.currentState.constructor.name
        )
        conversation.currentState.onEnter()
        const result = conversation.processMessage(messageContent)

        if (result.type === 'transition') {
            conversation.currentState.onExit()
            await this.handleTransition(conversation, result)
            conversation.currentState.onEnter()
        }

        await this.conversationRepository.save(conversation)

        if (conversation.currentState.shouldAutoTransition()) {
            const autoTransition = conversation.currentState.getAutoTransition()
            if (autoTransition && autoTransition.type === 'transition') {
                conversation.currentState.onExit()
                await this.handleTransition(conversation, autoTransition)
                conversation.currentState.onEnter()

                await this.conversationRepository.save(conversation)
            }
        }
    }

    private async saveMessage(
        conversation: Conversation,
        content: string,
        from: 'client' | 'employee' | 'AI',
        sender: Client | Employee
    ): Promise<Message> {
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
        switch (transition.targetState) {
            case 'initial_menu':
                console.log(
                    "[ClientMessageHandler.handleTransition] case 'initial_menu' -> config:\n",
                    this.config
                )
                conversation.transitionToState(
                    new InitialMenuState(conversation, this.config)
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

                const department = this.findDepartment(
                    availableDepartments,
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

                const department = this.findDepartment(
                    availableDepartments,
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

    private async getOrCreateConversation(company: Company, user: Client) {
        let conversation =
            await this.findConversationByClientPhoneUseCase.execute(
                company,
                user.phone
            )
        // console.log('findConversationByClientPhoneUseCase result:\n', conversation)

        if (conversation) {
            if (this.config.outputPort) {
                console.log('We need to injet this:\n', this.config.outputPort)
                conversation.currentState.outputPort = this.config.outputPort
            }
        } else {
            console.log('creating conversation')
            conversation = await this.createConversationUseCase.execute({
                user,
                company,
            })
        }

        return conversation
    }
}
