import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { AgentType, UserType } from '@/domain/whats-app/@types'

export class GetBaseMetricsUseCase {
	constructor(private conversationRepository: ConversationRepository) {}

	async execute(companyId: string, day = new Date()) {
		const totalChats = await this.conversationRepository.findByMonth(
			companyId,
			day
		)
		const chatWithAI = totalChats.filter(
			chat => chat.agentType === AgentType.AI
		)
		const totalClientChats = totalChats.filter(
			chat => chat.userType === UserType.CLIENT
		)
		const clientsIdsSet = new Set<string>(totalClientChats.map(CC => CC.userId))
		const todayTotalClientChats = totalClientChats.filter(chat => {
			const chatDate = chat.startedAt // ou outro campo que represente a data da conversa
			const today = new Date()

			return (
				chatDate.getDate() === today.getDate() &&
				chatDate.getMonth() === today.getMonth() &&
				chatDate.getFullYear() === today.getFullYear()
			)
		})
		let averageResponseTime = 0
		let responseTimeAccumulator = 0

		for (const chat of totalClientChats) {
			const firstMessage = chat.messages.at(0)

			if (!firstMessage) {
				throw new Error('No messages found in the conversation')
			}

			const firstMessageTimestamp = firstMessage.timestamp
			const conversationStartedAt = chat.startedAt
			responseTimeAccumulator +=
				firstMessageTimestamp.getTime() - conversationStartedAt.getTime()
		}

		if (totalClientChats.length > 0 && responseTimeAccumulator > 0) {
			const x = responseTimeAccumulator / totalClientChats.length
			averageResponseTime = Math.round(x / 1000) //seconds
		}

		return {
			totalChatsWithAI: chatWithAI.length,
			totalClientChats: totalClientChats.length,
			todayTotalClientChats: todayTotalClientChats.length,
			activeClients: clientsIdsSet.size,
			averageResponseTime,
		}
	}
}
