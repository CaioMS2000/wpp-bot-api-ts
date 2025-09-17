import { AIChatSessionRepository } from '@/repository/AIChatSessionRepository'
import type { PrismaClient, $Enums } from '@prisma/client'

export type AIChatEndReason =
	| 'COMPLETED'
	| 'ESCALATED'
	| 'USER_EXITED'
	| 'TIMEOUT'

export class PrismaAIChatSessionRepository implements AIChatSessionRepository {
	private readonly RECENT_MINUTES = 30

	constructor(private readonly prisma: PrismaClient) {}

	async start(tenantId: string, phone: string): Promise<string> {
		const session = await this.prisma.aIChatSession.create({
			data: { tenantId, phone },
		})

		return session.id
	}

	async end(
		tenantId: string,
		phone: string,
		reason: AIChatEndReason
	): Promise<void> {
		const open = await this.prisma.aIChatSession.findFirst({
			where: { tenantId, phone, endedAt: null },
			orderBy: { startedAt: 'desc' },
			select: { id: true },
		})
		if (!open) return
		await this.prisma.aIChatSession.update({
			where: { id: open.id },
			data: { endedAt: new Date(), endReason: reason },
		})
	}

	async endAndLink(
		tenantId: string,
		phone: string,
		conversationId: string,
		reason: AIChatEndReason = 'ESCALATED'
	): Promise<void> {
		const cutoff = new Date(Date.now() - this.RECENT_MINUTES * 60_000)
		const cand = await this.prisma.aIChatSession.findFirst({
			where: {
				tenantId,
				phone,
				OR: [{ endedAt: null }, { endedAt: { gt: cutoff } }],
			},
			orderBy: { startedAt: 'desc' },
			select: { id: true },
		})
		if (!cand) return
		await this.prisma.aIChatSession.update({
			where: { id: cand.id },
			data: { endedAt: new Date(), endReason: reason, conversationId },
		})
	}

	async setFinalSummary(
		tenantId: string,
		phone: string,
		summary: string
	): Promise<void> {
		const ended = await this.prisma.aIChatSession.findFirst({
			where: { tenantId, phone, endedAt: { not: null }, finalSummary: null },
			orderBy: { endedAt: 'desc' },
			select: { id: true },
		})
		if (!ended) return
		await this.prisma.aIChatSession.update({
			where: { id: ended.id },
			data: { finalSummary: summary },
		})
	}

	async appendMessage(
		tenantId: string,
		phone: string,
		sender: 'USER' | 'AI',
		text: string
	): Promise<void> {
		const open = await this.prisma.aIChatSession.findFirst({
			where: { tenantId, phone, endedAt: null },
			orderBy: { startedAt: 'desc' },
			select: { id: true },
		})
		if (!open) return
		await this.prisma.aIMessage.create({
			data: {
				aiChatSessionId: open.id,
				sender: sender as $Enums.AIMessageSender,
				text,
			},
		})
	}

	async getAIMessageCount(tenantId: string, phone: string): Promise<number> {
		const count = await this.prisma.aIMessage.count({
			where: {
				sender: 'AI',
				aiChatSession: {
					tenantId,
					phone,
				},
			},
		})
		return count
	}
}
