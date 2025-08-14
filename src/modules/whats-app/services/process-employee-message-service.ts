import { SenderType, UserType } from '@/@types'
import { Company } from '@/entities/company'
import { Conversation } from '@/entities/conversation'
import { Employee } from '@/entities/employee'
import { Message } from '@/entities/message'
import { logger } from '@/logger'
import { ConversationStateType } from '@/states'
import { ConversationService } from './conversation-service'
import { ConversationStateOrchestrator } from './state-orchestrator'

export class ProcessEmployeeMessageService {
	constructor(
		private conversationService: ConversationService,
		private orchestrator: ConversationStateOrchestrator
	) {}

	async process(
		company: Company,
		user: Employee,
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
				userType: UserType.EMPLOYEE,
				conversation,
				message: newMessage,
			})
		} catch (error) {
			logger.error('Error processing employee message:\n', error)
			throw error
		}
	}
	private async saveMessage(
		conversation: Conversation,
		content: string,
		sender: Employee
	): Promise<Message> {
		const message = Message.create({
			conversationId: conversation.id,
			senderId: sender.id,
			content,
			senderType: SenderType.EMPLOYEE,
		})

		conversation.messages.push(message)
		await this.conversationService.save(conversation)

		return message
	}

	private async getOrCreateConversation(
		company: Company,
		user: Employee
	): Promise<Conversation> {
		let conversation = await this.conversationService.findActiveForEmployee(
			company.id,
			user
		)

		if (!conversation) {
			conversation = await this.conversationService.createConversation({
				userId: user.id,
				companyId: company.id,
				userType: UserType.EMPLOYEE,
				state: ConversationStateType.BEGIN,
			})
		}

		return conversation
	}
}
