import { SenderType, UserType } from '@/@types'
import { Client } from '@/entities/client'
import { Company } from '@/entities/company'
import { Conversation } from '@/entities/conversation'
import { Message } from '@/entities/message'
import { logger } from '@/logger'
import { ConversationStateType } from '@/states'
import { ConversationService } from './conversation-service'
import { ConversationStateOrchestrator } from './state-orchestrator'

export class ProcessClientMessageService {
	constructor(
		private conversationService: ConversationService,
		private orchestrator: ConversationStateOrchestrator
	) {}

	async process(
		company: Company,
		user: Client,
		messageContent: string,
		name?: string
	) {
		try {
			const conversation = await this.getOrCreateConversation(company, user)

			const newMessage = await this.saveMessage(
				conversation,
				messageContent,
				user
			)

			await this.orchestrator.handle({
				company,
				user,
				userType: UserType.CLIENT,
				conversation,
				message: newMessage,
			})
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
			conversationId: conversation.id,
			senderId: sender.id,
			content,
			senderType: SenderType.CLIENT,
		})

		conversation.messages.push(message)
		await this.conversationService.save(conversation)

		return message
	}

	private async getOrCreateConversation(
		company: Company,
		user: Client
	): Promise<Conversation> {
		let conversation = await this.conversationService.findActiveForClient(
			company.id,
			user
		)

		if (!conversation) {
			conversation = await this.conversationService.createConversation({
				userId: user.id,
				companyId: company.id,
				userType: UserType.CLIENT,
				state: ConversationStateType.BEGIN,
			})
		}

		return conversation
	}
}
