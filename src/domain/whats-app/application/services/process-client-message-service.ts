import { logger } from '@/core/logger'
import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { Conversation } from '@/domain/entities/conversation'
import { Message } from '@/domain/entities/message'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { MessageRepository } from '@/domain/repositories/message-repository'
import { execute } from '@caioms/ts-utils/functions'
import {
    ConversationStateConfig,
    conversationStateDefaultConfig,
} from '../states/conversation-state'
import { CreateConversationUseCase } from '../use-cases/create-conversation-use-case'
import { FindConversationByClientPhoneUseCase } from '../use-cases/find-conversation-by-client-phone-use-case'
import { StateTransitionService } from './state-transition-service'

export class ProcessClientMessageService {
    constructor(
        private messageRepository: MessageRepository,
        private conversationRepository: ConversationRepository,
        private createConversationUseCase: CreateConversationUseCase,
        private findConversationByClientPhoneUseCase: FindConversationByClientPhoneUseCase,
        private stateTransitionService: StateTransitionService,
        private config: ConversationStateConfig = conversationStateDefaultConfig
    ) {}

    async process(
        company: Company,
        user: Client,
        messageContent: string,
        name?: string
    ) {
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
                conversation.currentState.onExit.bind(conversation.currentState)
            )
            await this.stateTransitionService.handleTransition(
                conversation,
                result
            )
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
            const autoTransition = conversation.currentState.getAutoTransition()
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
                await this.stateTransitionService.handleTransition(
                    conversation,
                    autoTransition
                )
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
    }

    private async saveMessage(
        conversation: Conversation,
        content: string,
        sender: Client
    ): Promise<Message> {
        const message = Message.create({
            conversation,
            timestamp: new Date(),
            from: 'client',
            content,
            sender,
        })

        await this.messageRepository.save(message)

        return message
    }

    private async getOrCreateConversation(
        company: Company,
        user: Client
    ): Promise<['new_conversation' | 'recovered_conversation', Conversation]> {
        let conversation =
            await this.findConversationByClientPhoneUseCase.execute(
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
}
