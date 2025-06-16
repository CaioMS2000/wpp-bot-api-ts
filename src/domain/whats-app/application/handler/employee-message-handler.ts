import { logger } from '@/core/logger'
import { OutputPort } from '@/core/output/output-port'
import { Client } from '@/domain/entities/client'
import { Conversation } from '@/domain/entities/conversation'
import { Employee } from '@/domain/entities/employee'
import { Message } from '@/domain/entities/message'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { MessageRepository } from '@/domain/repositories/message-repository'
import { StateTransition } from '../states/state-transition'
import { MessageHandler } from './message-handler'
import { FAQRepository } from '@/domain/repositories/faq-repository'
import { FAQItemsState } from '../states/faq-items-state'
import { FAQCategoriesState } from '../states/faq-categories-state'
import { InitialMenuState } from '../states/initial-menu-state'

export class EmployeeMessageHandler extends MessageHandler {
    constructor(
        private outputPort: OutputPort,
        private conversationRepository: ConversationRepository,
        private messageRepository: MessageRepository,
        public faqRepository: FAQRepository
    ) {
        super()
    }
    async process(
        user: Client | Employee,
        messageContent: string
    ): Promise<void> {
        if (user instanceof Client) {
            throw new Error(
                'This handler is for employees but you passed an client'
            )
        }

        let conversation =
            await this.conversationRepository.findActiveByClientPhone(
                user.phone
            )

        if (!conversation) {
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
        }
    }
}
