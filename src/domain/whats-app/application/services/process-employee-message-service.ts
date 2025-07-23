import { logger } from '@/core/logger'
import { Company } from '@/domain/entities/company'
import { Conversation } from '@/domain/entities/conversation'
import { Employee } from '@/domain/entities/employee'
import { Message } from '@/domain/entities/message'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { execute } from '@caioms/ts-utils/functions'
import { CreateConversationUseCase } from '../use-cases/create-conversation-use-case'
import { FindConversationByEmployeePhoneUseCase } from '../use-cases/find-conversation-by-employee-phone-use-case'
import { StateService } from './state-service'
import { SenderType, UserType } from '../../@types'

export class ProcessEmployeeMessageService {
	constructor(
		private stateService: StateService,
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
		const [conversationType, conversation] = await this.getOrCreateConversation(
			company,
			user
		)
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
				conversation.currentState.onEnter.bind(conversation.currentState)
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
				await this.stateService.createState(result)
			)

			logger.debug(
				"Running 'onEnter' for state:\n",
				conversation.currentState.constructor.name
			)
			await execute(
				conversation.currentState.onEnter.bind(conversation.currentState)
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

			conversation.transitionToState(await this.stateService.createState(next))

			logger.debug(
				"Running 'onEnter' for state:\n",
				conversation.currentState.constructor.name
			)
			await execute(
				conversation.currentState.onEnter.bind(conversation.currentState)
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
			conversationId: conversation.id,
			senderType: SenderType.EMPLOYEE,
			content,
			senderId: sender.id,
		})

		conversation.messages.push(message)
		await this.conversationRepository.save(conversation)
		logger.debug('Message saved')

		return message
	}

	private async getOrCreateConversation(
		company: Company,
		user: Employee
	): Promise<['new_conversation' | 'recovered_conversation', Conversation]> {
		let conversation =
			await this.findConversationByEmployeePhoneUseCase.execute(
				company.id,
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
				userType: UserType.EMPLOYEE,
			})
			conversationType = 'new_conversation'
		}

		if (!conversation.currentState.getOutputPort()) {
			logger.debug('No output port found for conversation:', conversation.id)
		}

		return [conversationType, conversation]
	}
}
