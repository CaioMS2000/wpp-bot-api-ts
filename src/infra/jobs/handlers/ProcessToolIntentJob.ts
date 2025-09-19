import type { ToolIntentJob } from '@/infra/jobs/MessageQueue'
import { logger as _logger } from '@/infra/logging/logger'
import type { CustomerServiceContextManager } from '@/modules/main/CustomerServiceContextManager'
import { WaitingInQueueState } from '@/modules/main/states/WaitingInQueueState'
import { InitialState } from '@/modules/main/states/InitialState'

export class ProcessToolIntentJob {
	constructor(private readonly contextManager: CustomerServiceContextManager) {}

	async handle(job: ToolIntentJob): Promise<void> {
		const { tenantId, userPhone, intents } = job
		if (!Array.isArray(intents) || intents.length === 0) return
		const first = intents[0]
		const logger = _logger.child({
			component: 'job.ProcessToolIntent',
			tenantId,
			userPhone,
			conversationId: job.conversationId,
			intent: first?.type,
		})
		try {
			logger.info('intent_received')
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
					logger.info('intent_ignored_for_employee')
				} catch {}
				return
			}
			const dept = first.department
			// Enfileira e transiciona para estado de espera
			try {
				await ctx.enqueueInDepartment(dept)
			} catch (err) {
				try {
					logger.warn('enqueue_failed', { department: dept, err: String(err) })
				} catch {}
				await ctx.sendMessage(
					`⛔️ *Departamento "${dept}" indisponível no momento.* Por favor, selecione novamente.`
				)
				await ctx.showDepartmentsMenu()
				return
			}
			try {
				logger.info('enqueue_ok', { department: dept })
			} catch {}
			await ctx.sendMessage(
				`✅ *Você entrou na fila do departamento: ${dept}.*\nAguarde atendimento. Para sair da fila, digite 'sair'.`
			)
			ctx.transitionTo(new WaitingInQueueState(ctx, dept))
			// Persist snapshot imediatamente
			await ctx.persistSnapshotNow()
			try {
				logger.info('state_transition_waiting_queue')
			} catch {}
		}

		// Encerrar conversa com a IA, se houver
		if (first.type === 'END_AI_CHAT') {
			const ctxRes = await this.contextManager.getContext(tenantId, userPhone)
			const ctx = ctxRes.context
			try {
				await ctx.setActor('', userPhone)
			} catch {}
			// Apenas clientes usam IA; mas a chamada é segura caso não haja sessão
			try {
				await ctx.endAIChatSession('COMPLETED')
			} catch {}
			// Volta ao estado inicial e mostra o menu
			try {
				ctx.transitionTo(new InitialState(ctx))
				await ctx.showInitialMenu()
				logger.info('intent_end_ai_chat_ok')
			} catch (err) {
				try {
					logger.warn('intent_end_ai_chat_failed', { err })
				} catch {}
			}
			return
		}
	}
}
