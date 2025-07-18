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
import { StateFactory } from '../factory/state-factory'

export class ProcessEmployeeMessageService {
    constructor(
        private stateFactory: StateFactory,
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

        const result = await conversation.processMessage(newMessage)

        if (result) {
            logger.debug(
                "Running 'onExit' for state:\n",
                conversation.currentState.constructor.name
            )
            await execute(
                conversation.currentState.onExit.bind(conversation.currentState)
            )

            conversation.transitionToState(
                this.stateFactory.create(conversation, result)
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
            const next = await conversation.currentState.getNextState()

            if (!next) {
                break
            }

            logger.debug('Auto-transitioning...')
            logger.debug('will transit to:\n', next)
            logger.debug(
                "Running 'onExit' for state:\n",
                conversation.currentState.constructor.name
            )

            await execute(
                conversation.currentState.onExit.bind(conversation.currentState)
            )

            conversation.transitionToState(
                this.stateFactory.create(conversation, next)
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
            conversationId: conversation.id,
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
                userId: user.id,
                companyId: company.id,
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
