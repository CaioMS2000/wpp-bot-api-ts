export type AIChatEndReason =
	| 'COMPLETED'
	| 'ESCALATED'
	| 'USER_EXITED'
	| 'TIMEOUT'

export interface AIChatSessionRepository {
	start(tenantId: string, phone: string): Promise<string>
	end(tenantId: string, phone: string, reason: AIChatEndReason): Promise<void>
	endAndLink(
		tenantId: string,
		phone: string,
		conversationId: string,
		reason?: AIChatEndReason
	): Promise<void>
	setFinalSummary(
		tenantId: string,
		phone: string,
		summary: string
	): Promise<void>
	appendMessage(
		tenantId: string,
		phone: string,
		sender: 'USER' | 'AI',
		text: string
	): Promise<void>
	getAIMessageCount(tenantId: string, phone: string): Promise<number>
}
