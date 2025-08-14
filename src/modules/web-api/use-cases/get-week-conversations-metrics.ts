import { ConversationService } from '@/modules/whats-app/services/conversation-service'

export class GetWeekConversationsMetrics {
	constructor(private conversationService: ConversationService) {}

	async execute(companyId: string, currentDate = new Date()) {
		// Garante que a data está no fuso horário local
		const today = new Date(currentDate)
		today.setHours(0, 0, 0, 0)

		// Encontra o domingo desta semana
		const sunday = new Date(today)
		sunday.setDate(today.getDate() - today.getDay())

		// Array para armazenar as métricas de cada dia
		const weekMetrics = []

		// Itera apenas pelos dias até hoje
		for (let i = 0; i <= Math.min(6, today.getDay()); i++) {
			const currentDay = new Date(sunday)
			currentDay.setDate(sunday.getDate() + i)

			const nextDay = new Date(currentDay)
			nextDay.setDate(currentDay.getDate() + 1)

			const conversations = await this.conversationService.getBetweenDates(
				companyId,
				currentDay,
				nextDay
			)

			weekMetrics.push({
				date: currentDay,
				dayOfWeek: i,
				total: conversations.length,
				conversations,
			})
		}

		return {
			from: sunday,
			to: today,
			metrics: weekMetrics,
		}
	}
}
