import { logger } from '@/core/logger'
import { OutputPort } from '@/core/output/output-port'
import { Company } from '@/domain/entities/company'
import { Conversation } from '@/domain/entities/conversation'
import { Employee } from '@/domain/entities/employee'
import { Message } from '@/domain/entities/message'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { MessageRepository } from '@/domain/repositories/message-repository'
import { execute } from '@caioms/ts-utils/functions'
import { CreateConversationUseCase } from '../use-cases/create-conversation-use-case'
import { FindConversationByEmployeePhoneUseCase } from '../use-cases/find-conversation-by-employee-phone-use-case'
import { StateTransitionService } from './state-transition-service'

export class ProcessEmployeeMessageService {
    constructor(
        private outputPort: OutputPort,
        private stateTransitionService: StateTransitionService,
        private messageRepository: MessageRepository,
        private conversationRepository: ConversationRepository,
        private findConversationByEmployeePhoneUseCase: FindConversationByEmployeePhoneUseCase,
        private createConversationUseCase: CreateConversationUseCase
    ) {}
    async process(
        company: Company,
        user: Employee,
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

        const transition = await conversation.processMessage(messageContent)

        if (transition) {
            logger.debug(
                "Running 'onExit' for state:\n",
                conversation.currentState.constructor.name
            )
            await execute(
                conversation.currentState.onExit.bind(conversation.currentState)
            )

            const resolvedTransition =
                await this.stateTransitionService.resolveIntent(
                    conversation,
                    transition
                )

            await this.stateTransitionService.handleTransition(
                conversation,
                resolvedTransition
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

        while (true) {
            const nextTransition =
                await conversation.currentState.getNextState()

            if (!nextTransition) {
                break
            }

            logger.debug('Auto-transitioning...')
            logger.debug('will transit to:\n', nextTransition)
            logger.debug(
                "Running 'onExit' for state:\n",
                conversation.currentState.constructor.name
            )

            await execute(
                conversation.currentState.onExit.bind(conversation.currentState)
            )

            const resolvedTransition =
                await this.stateTransitionService.resolveIntent(
                    conversation,
                    nextTransition
                )
            await this.stateTransitionService.handleTransition(
                conversation,
                resolvedTransition
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
    private async saveMessage(
        conversation: Conversation,
        content: string,
        sender: Employee
    ): Promise<Message> {
        const message = Message.create({
            conversation,
            timestamp: new Date(),
            from: 'employee',
            content,
            sender,
        })

        await this.messageRepository.save(message)

        logger.debug('Message saved')

        return message
    }

    private async getOrCreateConversation(
        company: Company,
        user: Employee
    ): Promise<['new_conversation' | 'recovered_conversation', Conversation]> {
        let conversation =
            await this.findConversationByEmployeePhoneUseCase.execute(
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

        conversation.currentState.setOutputPort(this.outputPort)

        return [conversationType, conversation]
    }
}
