import type { IncomingMessageJob } from '@/infra/jobs/MessageQueue'
import type { CustomerServiceContextManager } from '@/modules/main/CustomerServiceContextManager'
import type { PrismaClient } from '@prisma/client'
import type { IdempotencyStore } from '@/infra/jobs/IdempotencyStore'

export class ProcessIncomingMessageJob {
	constructor(
		private readonly prisma: PrismaClient,
		private readonly contextManager: CustomerServiceContextManager,
		private readonly idempotency: IdempotencyStore,
		private readonly idempotencyTtlMs = 30 * 60_000
	) {}

	async handle(job: IncomingMessageJob): Promise<void> {
		const key = `${job.tenantId}:${job.messageId}`
		if (await this.idempotency.seen(key)) {
			try {
				console.log('[Job] duplicate ignored by idempotency', { key })
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
			return
		}

		await context.sendMessage('🖼️ *Não temos suporte para envio de mídias.*')
	}
}
