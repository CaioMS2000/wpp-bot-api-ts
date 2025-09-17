import type { AIResponsePort } from '@/modules/main/ports/AIResponsePort'
import type { MessagingPort } from '@/modules/main/ports/MessagingPort'
import type { AIChatSessionRepository } from '@/repository/AIChatSessionRepository'
import type { ConversationRepository } from '@/repository/ConversationRepository'
import type { CustomerRepository } from '@/repository/CustomerRepository'
import type { DepartmentRepository } from '@/repository/DepartmentRepository'
import type { EmployeeRepository } from '@/repository/EmployeeRepository'
import type { FaqRepository } from '@/repository/FaqRepository'
import type { StateStore } from '@/repository/StateStore'
import { CustomerServiceContext } from './CustomerServiceContext'
import { EnergyBillIngestionService } from '@/infra/openai/EnergyBillIngestionService'
import { TenantRepository } from '@/repository/TenantRepository'
import { AIChatFinalSummaryService } from '@/infra/openai/AIChatFinalSummaryService'
import { ConversationFinalSummaryService } from '@/infra/openai/ConversationFinalSummaryService'

type Entry = { context: CustomerServiceContext; lastUsed: number }

export class CustomerServiceContextManager {
	private readonly contexts = new Map<string, Entry>()

	constructor(
		private readonly faqRepository: FaqRepository,
		private readonly departmentRepository: DepartmentRepository,
		private readonly employeeRepository: EmployeeRepository,
		private readonly conversationRepository: ConversationRepository,
		private readonly messaging: MessagingPort,
		private readonly stateStore: StateStore,
		private readonly customerRepository: CustomerRepository,
		private readonly tenantRepository: TenantRepository,
		private readonly aiResponsePort: AIResponsePort,
		private readonly aiChatRepo: AIChatSessionRepository,
		private readonly energyBillIngestionService: EnergyBillIngestionService,
		private readonly aiChatFinalSummaryService: AIChatFinalSummaryService,
		private readonly conversationFinalSummaryService: ConversationFinalSummaryService
	) {
		// periodic cleanup of idle contexts (> 30m)
		setInterval(() => this.cleanup(), 10 * 60 * 1000).unref()
	}

	async getContext(
		tenantId: string,
		phone: string
	): Promise<{ context: CustomerServiceContext; isNew: boolean }> {
		const now = Date.now()
		const key = `${tenantId}:${phone}`
		const existing = this.contexts.get(key)
		if (existing) {
			existing.lastUsed = now
			console.log('[ContextManager] reusing existing context', {
				tenantId,
				phone,
			})
			return { context: existing.context, isNew: false }
		}

		const ctx = new CustomerServiceContext(
			tenantId,
			this.faqRepository,
			this.departmentRepository,
			this.employeeRepository,
			this.conversationRepository,
			this.messaging,
			this.stateStore,
			this.customerRepository,
			this.tenantRepository,
			this.aiResponsePort,
			this.aiChatRepo,
			this.energyBillIngestionService,
			this.aiChatFinalSummaryService,
			this.conversationFinalSummaryService
		)
		// Attempt to restore last persisted state synchronously
		let isNew = true
		try {
			const snapshot = await this.stateStore.load(tenantId, phone)
			if (snapshot) {
				ctx.aiSessionId = snapshot.aiSessionId ?? null
				try {
					ctx.setStateByName(
						snapshot.state,
						snapshot.data as
							| {
									category?: string
									customerPhone?: string
									lastResponseId?: string
							  }
							| undefined
					)
				} catch (err: any) {
					console.error(
						"Error ocurred on 'CustomerServiceContextManager.getContext':"
					)
					console.dir(err, { depth: null, colors: true })
					throw err
				}
				console.log('[ContextManager] restored context from snapshot', {
					tenantId,
					phone,
					state: snapshot.state,
				})
				isNew = false
			}
		} catch (err: any) {
			// ignore load errors; treat as new
			console.error('[ContextManager] failed to load context snapshot', err)
		}
		this.contexts.set(key, { context: ctx, lastUsed: now })
		if (isNew) {
			console.log('[ContextManager] created new context', { tenantId, phone })
		}
		return { context: ctx, isNew }
	}

	async sendDirectMessage(
		to: string,
		from: string,
		message: string
	): Promise<void> {
		try {
			await this.messaging.sendText(to, from, message)
		} catch (err) {
			console.error('[ContextManager] failed to send direct message', err)
		}
	}

	private cleanup(): void {
		const cutoff = Date.now() - 30 * 60 * 1000
		for (const [key, entry] of this.contexts) {
			if (entry.lastUsed < cutoff) this.contexts.delete(key)
		}
	}
}
