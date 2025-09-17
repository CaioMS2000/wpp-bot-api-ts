import { PrismaClient } from '@prisma/client'
import { ConversationFinalSummaryService } from '@/infra/openai/ConversationFinalSummaryService'
import { env } from '@/config/env'
import { withPgAdvisoryLock } from './pg-lock'

export class AutoCloseJob {
	constructor(
		private readonly prisma: PrismaClient = new PrismaClient(),
		private readonly conversationFinalSummaryService?: ConversationFinalSummaryService
	) {}

	// slaMinutes: prazo para 1ª resposta humana após startedAt/arrivedAt
	// idleHours: inatividade máxima para auto-fechar conversas
	async runOnce({
		slaMinutes,
		idleHours,
	}: { slaMinutes?: number; idleHours?: number } = {}): Promise<void> {
		const now = new Date()
		const sla = slaMinutes ?? env.AUTO_CLOSE_SLA_MINUTES
		const idle = idleHours ?? env.AUTO_CLOSE_IDLE_HOURS
		const slaMs = sla * 60_000
		const idleMs = idle * 60 * 60_000

		const actives = await this.prisma.conversation.findMany({
			where: { active: true },
			select: { id: true, tenantId: true, startedAt: true, arrivedAt: true },
		})

		let slaClosed = 0
		let idleClosed = 0
		for (const c of actives) {
			// Find first employee reply
			const firstEmp = await this.prisma.message.findFirst({
				where: { conversationId: c.id, sender: 'EMPLOYEE' },
				orderBy: { createdAt: 'asc' },
				select: { createdAt: true },
			})

			// SLA: no first employee reply within window (prefer arrivedAt if available)
			const ref = c.arrivedAt ?? c.startedAt
			const slaDue = ref.getTime() + slaMs
			if (!firstEmp && now.getTime() > slaDue) {
				await this.prisma.conversation.update({
					where: { id: c.id },
					data: { active: false, endedAt: now, resolution: 'UNRESOLVED' },
				})
				try {
					await this.conversationFinalSummaryService?.summarizeConversation(
						c.tenantId,
						c.id
					)
				} catch {}
				slaClosed++
				continue
			}

			// Idle: no activity within idle window
			const lastMsg = await this.prisma.message.findFirst({
				where: { conversationId: c.id },
				orderBy: { createdAt: 'desc' },
				select: { createdAt: true },
			})
			const last = lastMsg?.createdAt ?? c.startedAt
			if (now.getTime() - last.getTime() > idleMs) {
				await this.prisma.conversation.update({
					where: { id: c.id },
					data: { active: false, endedAt: now, resolution: 'UNRESOLVED' },
				})
				try {
					await this.conversationFinalSummaryService?.summarizeConversation(
						c.tenantId,
						c.id
					)
				} catch {}
				idleClosed++
			}
		}

		if (slaClosed || idleClosed) {
			console.log(
				`[AutoCloseJob] Closed ${slaClosed} by SLA and ${idleClosed} by idle at ${now.toISOString()} (SLA=${sla}m, IDLE=${idle}h)`
			)
		}
	}

	/** Runs the job guarded by a Postgres advisory lock to avoid duplicate executions across replicas */
	async runWithLock(): Promise<void> {
		const key = 'auto_close_job_v1'
		const res = await withPgAdvisoryLock(this.prisma, key, async () => {
			await this.runOnce()
			return true as const
		})
		if (res === null) {
			console.log('[AutoCloseJob] Skipping run (lock not acquired)')
		}
	}
}
