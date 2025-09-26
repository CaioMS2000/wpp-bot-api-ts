import { PrismaClient } from '@prisma/client'
import { AuditStorage } from '@/infra/storage/AuditStorage'
import { logger } from '@/infra/logging/logger'

export class ConversationPurgeJob {
	constructor(
		private readonly prisma: PrismaClient,
		private readonly storage = new AuditStorage()
	) {}

	async runOnce(): Promise<void> {
		const now = new Date()
		// Select logs eligible for purge (already archived and past grace period)
		const logs = await this.prisma.conversationLog.findMany({
			where: { archivedAt: { not: null }, purgeAt: { lte: now } },
			select: { id: true, tenantId: true, conversationId: true, s3Uri: true },
			take: 100,
			orderBy: { startedAt: 'asc' },
		})
		if (logs.length === 0) return

		let purged = 0
		for (const log of logs) {
			try {
				// Safety: ensure the archived object exists before deleting DB messages.
				if (!log.s3Uri) {
					logger.warn('conversation_purge_skipped_no_uri', {
						component: 'ConversationPurgeJob',
						conversationId: log.conversationId,
					})
					continue
				}
				const exists = await this.storage.existsUri(log.s3Uri)
				if (!exists) {
					logger.warn('conversation_purge_skipped_missing_object', {
						component: 'ConversationPurgeJob',
						conversationId: log.conversationId,
						s3Uri: log.s3Uri,
					})
					continue
				}

				await this.prisma.conversationMessage.deleteMany({
					where: { logId: log.id },
				})
				purged++
			} catch (err) {
				logger.warn('conversation_purge_failed', {
					component: 'ConversationPurgeJob',
					err,
					conversationId: log.conversationId,
				})
			}
		}

		if (purged) {
			logger.info('conversation_purge_summary', {
				component: 'ConversationPurgeJob',
				purged,
			})
		}
	}
}
