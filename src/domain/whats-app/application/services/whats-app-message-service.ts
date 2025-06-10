import { Client } from '@/domain/entities/client'
import { Conversation } from '@/domain/entities/conversation'
import { Department } from '@/domain/entities/department'
import { Message } from '@/domain/entities/message'
import { ClientRepository } from '@/domain/repositories/client-repository'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { DepartmentRepository } from '@/domain/repositories/department-repository'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { MessageRepository } from '@/domain/repositories/message-repository'
import { MenuOption } from '../../@types'
import { AIChatState } from '../states/ai-chat-state'
import { DepartmentChatState } from '../states/department-chat-state'
import { DepartmentSelectionState } from '../states/department-selection-state'
import { FAQCategoriesState } from '../states/faq-categories-state'
import { FAQItemsState } from '../states/faq-items-state'
import { InitialMenuState } from '../states/initial-menu-state'
import { StateTransition } from '../states/state-transition'

export class WhatsAppMessageService {
    constructor(
        private conversationRepository: ConversationRepository,
        public departmentRepository: DepartmentRepository,
        public faqRepository: FAQRepository,
        private messageRepository: MessageRepository,
        private clientRepository: ClientRepository
    ) {}

    async processIncomingMessage(clientPhone: string, messageContent: string) {
        console.log('\n\n\n\n\n\n\nprocessIncomingMessage')
        console.log('messageContent', messageContent)

        let conversation =
            await this.conversationRepository.findActiveByClientPhone(
                clientPhone
            )

        if (!conversation) {
            const client = await this.getOrCreateClient(clientPhone)
            conversation = Conversation.create({
                client,
                agent: 'AI',
                participants: [client],
                messages: [],
            })
            await this.conversationRepository.save(conversation)
        }

        await this.saveMessage(conversation, messageContent, 'client')
        await this.conversationRepository.save(conversation)

        const result = conversation.processMessage(messageContent)

        console.log('result')
        console.log(result)

        if (result.type === 'transition') {
            await this.handleTransition(conversation, result)
        }

        console.log('\nconversation')
        console.log(conversation)
        console.log(conversation.currentState.getResponse())

        return {
            to: conversation.client.phone,
            message: conversation.currentState.getResponse(),
        }
    }

    private async getOrCreateClient(phone: string): Promise<Client> {
        // Tenta buscar cliente existente
        let client = await this.clientRepository.findByPhone(phone)

        if (!client) {
            // Cria novo cliente
            client = Client.create({
                phone,
                state: 'initial_menu',
                department: '',
                event_history: [],
            })
            await this.clientRepository.save(client)
        }

        return client
    }

    private async saveMessage(
        conversation: Conversation,
        content: string,
        from: 'client' | 'employee' | 'AI'
    ): Promise<Message> {
        const message = Message.create({
            conversation,
            timestamp: new Date(),
            from,
            content,
        })

        await this.messageRepository.save(message)

        return message
    }

    private async handleTransition(
        conversation: Conversation,
        transition: StateTransition
    ) {
        console.log('\n\nhandleTransition')
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
        }
    }
}
