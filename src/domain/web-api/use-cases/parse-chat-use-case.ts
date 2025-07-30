import { ClientRepository } from '@/domain/repositories/client-repository'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { EmployeeRepository } from '@/domain/repositories/employee-repository'
import { SenderType } from '@/domain/whats-app/@types'
import { ChatMessage } from '../@types'

export class ParseChatUseCase {
	constructor(
		private clientRepository: ClientRepository,
		private employeeRepository: EmployeeRepository,
		private conversationRepository: ConversationRepository
	) {}

	async execute(companyId: string, conversationId: string) {
		const conversation = await this.conversationRepository.findOrThrow(
			companyId,
			conversationId
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
					const client = await this.clientRepository.findOrThrow(
						conversation.companyId,
						m.senderId
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
					const employee = await this.employeeRepository.findOrThrow(
						conversation.companyId,
						m.senderId
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
				default:
					throw new Error('Invalid sender type')
			}
		}

		return chat
	}
}
