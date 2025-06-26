import { logger } from '@/core/logger'
import { OutputPort } from '@/core/output/output-port'
import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { Employee } from '@/domain/entities/employee'
import { Message } from '@/domain/entities/message'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { MessageRepository } from '@/domain/repositories/message-repository'
import { StateFactory } from '../factory/state-factory'
import { StateTransition } from '../states/state-transition'
import { CreateConversationUseCase } from '../use-cases/create-conversation-use-case'
import { FindConversationByEmployeePhoneUseCase } from '../use-cases/find-conversation-by-employee-phone-use-case'
import { ListActiveDepartmentsUseCase } from '../use-cases/list-active-departments-use-case'
import { TransferEmployeeToClientConversationUseCase } from '../use-cases/transfer-employee-to-client-conversation-use-case'
import { MessageHandler } from './message-handler'
import {
    ConversationStateConfig,
    conversationStateDefaultConfig,
} from '../states/conversation-state'

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
        user: Client | Employee,
        messageContent: string
    ): Promise<void> {
        if (user instanceof Client) {
            throw new Error(
                'This handler is for employees but you passed a client'
            )
        }

        const conversation = await this.getOrCreateConversation(company, user)

        await this.saveMessage(conversation, messageContent, 'employee', user)
        await this.conversationRepository.save(conversation)

        const result = conversation.processMessage(messageContent)
        conversation.currentState.onEnter()

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
            //     case 'department_queue': {
            //         const department = this.findDepartment(availableDepartments, transition.data)
            //         break
            //     }
        }
    }

    private async getOrCreateConversation(company: Company, user: Employee) {
        let conversation =
            await this.findConversationByEmployeePhoneUseCase.execute(
                company,
                user.phone
            )

        if (conversation) {
            if (this.config.outputPort) {
                conversation.currentState.outputPort = this.config.outputPort
            }
        } else {
            conversation = await this.createConversationUseCase.execute({
                user,
                company,
            })
        }

        return conversation
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
