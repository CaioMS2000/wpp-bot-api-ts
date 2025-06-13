import { OutputPort } from '@/core/output/output-port'
import { Client } from '@/domain/entities/client'
import { Conversation } from '@/domain/entities/conversation'
import { Message } from '@/domain/entities/message'
import { ClientRepository } from '@/domain/repositories/client-repository'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { MessageRepository } from '@/domain/repositories/message-repository'
import { DepartmentChatState } from '../states/department-chat-state'
import { DepartmentQueueState } from '../states/department-queue-state'
import { DepartmentSelectionState } from '../states/department-selection-state'
import { FAQCategoriesState } from '../states/faq-categories-state'
import { FAQItemsState } from '../states/faq-items-state'
import { InitialMenuState } from '../states/initial-menu-state'
import { StateTransition } from '../states/state-transition'
import { Employee } from '@/domain/entities/employee'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { MessageHandler } from '../handler/message-handler'

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
            throw new Error(
                'This handler is for clients but you passed an employee'
            )
        }

        let conversation =
            await this.conversationRepository.findActiveByClientPhone(
                user.phone
            )

        if (!conversation) {
            conversation = Conversation.create({
                client: user,
                agent: 'AI',
                participants: [user],
                messages: [],
            })
            await this.conversationRepository.save(conversation)
        }

        await this.saveMessage(conversation, messageContent, 'client', user)
        await this.conversationRepository.save(conversation)

        const messages: string[] = []

        console.log(
            `I'll proccess message using this state: ${conversation.currentState.constructor.name}`
        )
        const result = conversation.processMessage(messageContent)

        if (result.type === 'transition') {
            await this.handleTransition(conversation, result)
        }

        console.log('\npost "handleTransition"\nconversation')
        console.log(conversation)

        if (conversation.currentState.entryMessage) {
            messages.push(conversation.currentState.entryMessage)
        }

        if (conversation.currentState.shouldAutoTransition()) {
            console.log("let's auto transit")
            const autoTransition = conversation.currentState.getAutoTransition()
            if (autoTransition && autoTransition.type === 'transition') {
                await this.handleTransition(conversation, autoTransition)

                console.log(
                    '\npost "handleTransition" for auto transit\nconversation'
                )
                console.log(conversation)

                if (conversation.currentState.entryMessage) {
                    messages.push(conversation.currentState.entryMessage)
                }
            }
        }

        this.outputPort.handle({
            input: messageContent,
            output: { to: conversation.client.phone, messages },
        })
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
        console.log('\n\n"handleTransition" method')
        // console.log("conversation")
        // console.log(conversation)
        console.log('transition')
        console.log(transition)

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
                    throw new Error('Invalid transition data')
                }

                const faqItems = await this.faqRepository.findItemsByCategory(
                    transition.data
                )

                conversation.transitionToState(
                    new FAQItemsState(conversation, transition.data, faqItems)
                )
                break
        }

        const availableDepartments =
            await this.departmentRepository.findAllActive()

        switch (transition.targetState) {
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
                    throw new Error('Invalid transition data')
                }

                const department = availableDepartments.find(
                    department => department.name === transition.data
                )

                if (!department) {
                    throw new Error('Department not found')
                }

                conversation.transitionToState(
                    new DepartmentChatState(conversation, department)
                )
                break
            }
            case 'department_queue': {
                if (typeof transition.data !== 'string') {
                    throw new Error('Invalid transition data')
                }

                const department = availableDepartments.find(
                    department => department.name === transition.data
                )

                if (!department) {
                    throw new Error('Department not found')
                }

                conversation.transitionToState(
                    new DepartmentQueueState(conversation, department)
                )
                break
            }
        }
    }
}
