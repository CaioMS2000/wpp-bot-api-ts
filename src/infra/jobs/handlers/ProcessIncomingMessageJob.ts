import type { IdempotencyStore } from '@/infra/jobs/IdempotencyStore'
import type { IncomingMessageJob } from '@/infra/jobs/MessageQueue'
import { logger as _logger } from '@/infra/logging/logger'
import type { CustomerServiceContextManager } from '@/modules/main/CustomerServiceContextManager'
import type { PrismaClient } from '@prisma/client'

export class ProcessIncomingMessageJob {
	constructor(
		private readonly prisma: PrismaClient,
		private readonly contextManager: CustomerServiceContextManager,
		private readonly idempotency: IdempotencyStore,
		private readonly idempotencyTtlMs = 30 * 60_000
	) {}

	async handle(job: IncomingMessageJob): Promise<void> {
		const key = `${job.tenantId}:${job.messageId}`
		const logger = _logger.child({
			component: 'job.ProcessIncomingMessage',
			tenantId: job.tenantId,
			messageId: job.messageId,
			from: job.from,
			to: job.to,
		})
		logger.info('incoming_job_received', {
			kind: job.kind,
			contentKind: job.content.kind,
		})
		if (await this.idempotency.seen(key)) {
			try {
				logger.info('idempotent_duplicate_ignored', { key })
			} catch {}
			return
		}
		await this.idempotency.mark(key, this.idempotencyTtlMs)

		const { tenantId, from, name, content } = job
		const ctxResult = await this.contextManager.getContext(tenantId, from)
		const context = ctxResult.context
		await context.setActor(name, from)

		// Reaproveita lógica de receive-message.ts para tipos aceitos
		const isTextual = ['text', 'list_reply', 'button_reply'].includes(
			content.kind
		)
		if (isTextual) {
			let message = ''
			switch (content.kind) {
				case 'text':
					message = content.text ?? ''
					break
				case 'list_reply':
				case 'button_reply':
					message = content.title ?? ''
					break
			}
			if (ctxResult.isNew) await context.sendMessage('👋 *Bem-vindo*')
			await context.receive(message)
			logger.info('incoming_job_processed', { result: 'textual_processed' })
			return
		}

		const isPdfDocument =
			content.kind === 'document' &&
			(content.media?.mime?.toLowerCase?.() === 'application/pdf' ||
				(content.media?.filename?.toLowerCase?.().endsWith('.pdf') ?? false))

		const inAIChat = context.getCurrentStateName() === 'ai_chat'
		if (isPdfDocument && inAIChat && content.media?.id) {
			await context.ingestEnergyBillPdf(
				content.media.id,
				content.media.filename ?? null
			)
			logger.info('incoming_job_processed', { result: 'pdf_ingested' })
			return
		}

		await context.sendMessage('🖼️ *Não temos suporte para envio de mídias.*')
		logger.info('incoming_job_processed', { result: 'unsupported_media' })
	}
}
