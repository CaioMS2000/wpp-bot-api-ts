import { SenderType } from '@/@types'
import { ChatMessage } from '../@types'
import { ConversationService } from '@/modules/whats-app/services/conversation-service'
import { UserService } from '@/modules/whats-app/services/user-service'

export class ParseChatUseCase {
	constructor(
		private userService: UserService,
		private conversationService: ConversationService
	) {}

	async execute(companyId: string, conversationId: string) {
		const conversation = await this.conversationService.getConversation(
			companyId,
			conversationId,
			{ notNull: true }
		)

		const chat = {
			id: conversation.id,
			startedAt: conversation.startedAt,
			endedAt: conversation.endedAt,
			messages: new Array<ChatMessage>(),
		}

		for (const m of conversation.messages) {
			const messageContent = m.content
			const messageTimestamp = m.timestamp

			switch (m.senderType) {
				case SenderType.CLIENT: {
					if (!m.senderId) {
						throw new Error('Client ID is required')
					}
					const client = await this.userService.getClient(
						conversation.companyId,
						m.senderId,
						{ notNull: true }
					)

					chat.messages.push({
						content: messageContent,
						sender: 'client',
						timestamp: messageTimestamp,
						senderName: client.name,
					})
					break
				}
				case SenderType.EMPLOYEE: {
					if (!m.senderId) {
						throw new Error('Employee ID is required')
					}
					const employee = await this.userService.getEmployee(
						conversation.companyId,
						m.senderId,
						{ notNull: true }
					)

					chat.messages.push({
						content: messageContent,
						sender: 'employee',
						timestamp: messageTimestamp,
						senderName: employee.name,
					})
					break
				}
				case SenderType.AI: {
					chat.messages.push({
						content: messageContent,
						sender: 'ai',
						timestamp: messageTimestamp,
						senderName: 'AI',
					})
					break
				}
				case SenderType.SYSTEM: {
					chat.messages.push({
						content: messageContent,
						sender: 'system',
						timestamp: messageTimestamp,
						senderName: 'SYSTEM',
					})
					break
				}
				default:
					throw new Error('Invalid sender type')
			}
		}

		return chat
	}
}
