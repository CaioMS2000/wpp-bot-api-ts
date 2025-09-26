import { PrismaClient } from '@prisma/client'
import { GlobalConfigService } from '@/infra/config/GlobalConfigService'
import { AuditStorage } from '@/infra/storage/AuditStorage'
import { logger } from '@/infra/logging/logger'

function yyyymm(d: Date): { yyyy: string; mm: string } {
	const yyyy = String(d.getUTCFullYear())
	const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
	return { yyyy, mm }
}

export class ConversationArchiveJob {
	constructor(
		private readonly prisma: PrismaClient,
		private readonly config: GlobalConfigService,
		private readonly storage = new AuditStorage()
	) {}

	private async getNumber(key: string, def: number): Promise<number> {
		try {
			const v = await this.config.getNumber(key, def)
			return typeof v === 'number' && Number.isFinite(v) ? v : def
		} catch {
			return def
		}
	}

	async runOnce(): Promise<void> {
		const delayDays = await this.getNumber('CONVERSATION_ARCHIVE_DELAY_DAYS', 1)
		const purgeGraceDays = await this.getNumber(
			'CONVERSATION_PURGE_GRACE_DAYS',
			30
		)
		const cutoff = new Date(Date.now() - delayDays * 24 * 60 * 60 * 1000)

		// Eligible: closed and not archived
		const logs = await this.prisma.conversationLog.findMany({
			where: { closedAt: { lte: cutoff }, archivedAt: null },
			select: {
				id: true,
				tenantId: true,
				conversationId: true,
				userPhone: true,
				role: true,
				startedAt: true,
				closedAt: true,
			},
			take: 50,
			orderBy: { startedAt: 'asc' },
		})

		if (logs.length === 0) return

		let ok = 0
		for (const log of logs) {
			try {
				const messages = await this.prisma.conversationMessage.findMany({
					where: { logId: log.id },
					orderBy: { at: 'asc' },
					select: {
						at: true,
						kind: true,
						text: true,
						model: true,
						responseId: true,
						usageJson: true,
						system: true,
						toolsJson: true,
						vectorStoreId: true,
						fileSearchJson: true,
						toolJson: true,
					},
				})

				const convo = await this.prisma.conversation.findUnique({
					where: { id: log.conversationId },
					select: { finalSummary: true },
				})

				const exportObj = {
					meta: {
						tenantId: log.tenantId,
						conversationId: log.conversationId,
						userPhone: log.userPhone,
						role: log.role,
						startedAt: log.startedAt.toISOString(),
						closedAt: log.closedAt ? log.closedAt.toISOString() : null,
						finalSummary: convo?.finalSummary ?? null,
					},
					messages: messages.map(m => ({
						at: m.at.toISOString(),
						kind: m.kind,
						text: m.text,
						model: m.model ?? undefined,
						responseId: m.responseId ?? undefined,
						usage: m.usageJson ?? undefined,
						system: m.system ?? undefined,
						tools: (m.toolsJson as any) ?? undefined,
						vectorStoreId: m.vectorStoreId ?? undefined,
						fileSearch: m.fileSearchJson ?? undefined,
						tool: m.toolJson ?? undefined,
					})),
				}

				const { yyyy, mm } = yyyymm(log.startedAt)
				const key = `audits/conversations/${log.tenantId}/${yyyy}/${mm}/${log.conversationId}.json`
				const s3Uri = await this.storage.putJson(key, exportObj)

				const archivedAt = new Date()
				const purgeAt = new Date(
					archivedAt.getTime() + purgeGraceDays * 24 * 60 * 60 * 1000
				)
				await this.prisma.conversationLog.update({
					where: {
						tenantId_conversationId: {
							tenantId: log.tenantId,
							conversationId: log.conversationId,
						},
					},
					data: { archivedAt, purgeAt, s3Uri },
				})
				ok++
			} catch (err) {
				logger.warn('conversation_archive_failed', {
					component: 'ConversationArchiveJob',
					err,
					conversationId: log.conversationId,
				})
			}
		}

		if (ok) {
			logger.info('conversation_archive_summary', {
				component: 'ConversationArchiveJob',
				archived: ok,
			})
		}
	}
}
