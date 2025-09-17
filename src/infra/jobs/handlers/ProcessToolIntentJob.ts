import type { CustomerServiceContextManager } from '@/modules/main/CustomerServiceContextManager'
import type { ToolIntentJob } from '@/infra/jobs/MessageQueue'
import { WaitingInQueueState } from '@/modules/main/states/WaitingInQueueState'

export class ProcessToolIntentJob {
	constructor(private readonly contextManager: CustomerServiceContextManager) {}

	async handle(job: ToolIntentJob): Promise<void> {
		const { tenantId, userPhone, intents } = job
		if (!Array.isArray(intents) || intents.length === 0) return
		const first = intents[0]
		try {
			console.log('[IntentJob] received', {
				tenantId,
				userPhone,
				kind: first.type,
			})
		} catch {}
		if (first.type === 'ENTER_QUEUE') {
			const ctxRes = await this.contextManager.getContext(tenantId, userPhone)
			const ctx = ctxRes.context
			// Definir ator para avaliar corretamente se é funcionário
			try {
				await ctx.setActor('', userPhone)
			} catch {}
			// Ignorar intents de fila para funcionários
			if (ctx.isEmployee()) {
				try {
					console.log('[IntentJob] ENTER_QUEUE ignored for employee', {
						tenantId,
						userPhone,
					})
				} catch {}
				return
			}
			const dept = first.department
			// Enfileira e transiciona para estado de espera
			try {
				await ctx.enqueueInDepartment(dept)
			} catch (err) {
				try {
					console.log('[IntentJob] enqueue failed', {
						tenantId,
						userPhone,
						department: dept,
						err: String(err),
					})
				} catch {}
				await ctx.sendMessage(
					`⛔️ *Departamento "${dept}" indisponível no momento.* Por favor, selecione novamente.`
				)
				await ctx.showDepartmentsMenu()
				return
			}
			try {
				console.log('[IntentJob] enqueued customer into department', {
					tenantId,
					userPhone,
					department: dept,
				})
			} catch {}
			await ctx.sendMessage(
				`✅ *Você entrou na fila do departamento: ${dept}.*\nAguarde atendimento. Para sair da fila, digite 'sair'.`
			)
			ctx.transitionTo(new WaitingInQueueState(ctx, dept))
			// Persist snapshot imediatamente
			await ctx.persistSnapshotNow()
			try {
				console.log(
					'[IntentJob] transitioned state to waiting_queue and snapshot saved'
				)
			} catch {}
		}
	}
}
