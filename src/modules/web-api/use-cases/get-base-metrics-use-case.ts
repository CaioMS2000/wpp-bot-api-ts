import { AgentType, CloseReason, UserType } from '@/@types'
import { ConversationService } from '@/modules/whats-app/services/conversation-service'

type Metrics = {
	todayConversationsCount: number
	totalActiveClients: number
	responseRate: number
	averageResponseTime: number
	totalAiConversations: number
}

export class GetBaseMetricsUseCase {
	constructor(private conversationService: ConversationService) {}

	async execute(companyId: string, day = new Date()): Promise<Metrics> {
		const totalChats = await this.conversationService.getByMonth(companyId, day)
		const totalClientChats = totalChats.filter(
			chat => chat.userType === UserType.CLIENT
		)
		const chatWithAI = totalClientChats.filter(
			chat => chat.agentType === AgentType.AI
		)
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
			totalAiConversations: chatWithAI.length,
			totalActiveClients: totalClientChats.length,
			todayConversationsCount: todayTotalClientChats.length,
			responseRate: 1, // valor decimal; no front precisa converter para %
			averageResponseTime,
		}
	}
}
