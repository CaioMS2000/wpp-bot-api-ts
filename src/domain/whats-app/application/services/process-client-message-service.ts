import { logger } from '@/core/logger'
import { OutputPort } from '@/core/output/output-port'
import { Client } from '@/domain/entities/client'
import { Company } from '@/domain/entities/company'
import { Conversation } from '@/domain/entities/conversation'
import { Message } from '@/domain/entities/message'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { MessageRepository } from '@/domain/repositories/message-repository'
import { execute } from '@caioms/ts-utils/functions'
import { CreateConversationUseCase } from '../use-cases/create-conversation-use-case'
import { FindConversationByClientPhoneUseCase } from '../use-cases/find-conversation-by-client-phone-use-case'
import { StateFactory } from '../factory/state-factory'

export class ProcessClientMessageService {
    constructor(
        private messageRepository: MessageRepository,
        private conversationRepository: ConversationRepository,
        private createConversationUseCase: CreateConversationUseCase,
        private findConversationByClientPhoneUseCase: FindConversationByClientPhoneUseCase,
        private stateFactory: StateFactory
    ) {}

    async process(
        company: Company,
        user: Client,
        messageContent: string,
        name?: string
    ) {
        try {
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
                    "Running 'onEnter' for state:",
                    conversation.currentState.constructor.name
                )
                return await execute(
                    conversation.currentState.onEnter.bind(
                        conversation.currentState
                    )
                )
            }

            const result = await conversation.processMessage(newMessage)
            logger.debug('Result of first "processMessage":', result)
            if (result) {
                logger.debug(
                    "Running 'onExit' for state:",
                    conversation.currentState.constructor.name
                )
                await execute(
                    conversation.currentState.onExit.bind(
                        conversation.currentState
                    )
                )

                conversation.transitionToState(
                    this.stateFactory.create(conversation, result)
                )

                logger.debug(
                    "Running 'onEnter' for state:",
                    conversation.currentState.constructor.name
                )
                await execute(
                    conversation.currentState.onEnter.bind(
                        conversation.currentState
                    )
                )

                await this.conversationRepository.save(conversation)
            }

            while (true) {
                const next = await conversation.currentState.getNextState()

                logger.debug(
                    'Current state:',
                    conversation.currentState.constructor.name
                )
                logger.debug('Next state:', next)

                if (!next) {
                    break
                }

                logger.debug('Auto-transitioning...')
                logger.debug('Will transition to:', next)
                logger.debug(
                    "Running 'onExit' for state:",
                    conversation.currentState.constructor.name
                )
                await execute(
                    conversation.currentState.onExit.bind(
                        conversation.currentState
                    )
                )

                conversation.transitionToState(
                    this.stateFactory.create(conversation, next)
                )

                logger.debug(
                    "Running 'onEnter' for state:",
                    conversation.currentState.constructor.name
                )
                await execute(
                    conversation.currentState.onEnter.bind(
                        conversation.currentState
                    )
                )

                await this.conversationRepository.save(conversation)
            }
        } catch (error) {
            logger.error('Error processing client message:\n', error)
            throw error
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

        if (!conversation.currentState.getOutputPort()) {
            logger.debug(
                'No output port found for conversation:',
                conversation.id
            )
        }

        return [conversationType, conversation]
    }
}
