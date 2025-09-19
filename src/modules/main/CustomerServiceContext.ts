import { logger } from '@/infra/logging/logger'
import { AIChatFinalSummaryService } from '@/infra/openai/AIChatFinalSummaryService'
import { ConversationFinalSummaryService } from '@/infra/openai/ConversationFinalSummaryService'
import { EnergyBillIngestionService } from '@/infra/openai/EnergyBillIngestionService'
import type { AIResponsePort } from '@/modules/main/ports/AIResponsePort'
import type { MsgListSection } from '@/modules/main/ports/MessagingPort'
import type {
	AIChatEndReason,
	AIChatSessionRepository,
} from '@/repository/AIChatSessionRepository'
import type { ConversationRepository } from '@/repository/ConversationRepository'
import type { ActiveConversation } from '@/repository/ConversationRepository'
import type { CustomerRepository } from '@/repository/CustomerRepository'
import { DepartmentRepository } from '@/repository/DepartmentRepository'
import { EmployeeRepository } from '@/repository/EmployeeRepository'
import { FaqRepository } from '@/repository/FaqRepository'
import type { StateStore } from '@/repository/StateStore'
import type { TenantRepository } from '@/repository/TenantRepository'
import type { $Enums } from '@prisma/client'
import { State } from './State'
import type { MessagingPort } from './ports/MessagingPort'
import { AIChatState } from './states/AIChatState'
import { DepartmentMenuState } from './states/DepartmentMenuState'
import { FaqCategoryState } from './states/FaqCategoryState'
import { FaqMenuState } from './states/FaqMenuState'
import { InConversationState } from './states/InConversationState'
import { InitialState } from './states/InitialState'

/**
 * Contexto principal do atendimento.
 * Mantém dados fixos e fornece acesso a dados dinâmicos.
 */
export class CustomerServiceContext {
	private state: State

	// Actor info resolved per incoming message
	private actorName = ''
	private actorPhone: string | null = null
	private actorIsEmployee = false
	private actorEmployeeDept: string | null = null
	private lastPersistedStateName: string | null = null
	public aiSessionId: string | null = null
	private log = logger.child({ component: 'CustomerService' })

	constructor(
		private readonly tenantId: string,
		private readonly faqRepository: FaqRepository,
		private readonly departmentRepository: DepartmentRepository,
		private readonly employeeRepository: EmployeeRepository,
		private readonly conversationRepository: ConversationRepository,
		private readonly messaging: MessagingPort,
		private readonly stateStore: StateStore,
		private readonly customerRepository: CustomerRepository,
		private readonly tenantRepository: TenantRepository,
		private readonly aiResponse: AIResponsePort,
		private readonly aiChatRepository: AIChatSessionRepository,
		private readonly energyBillIngestionService: EnergyBillIngestionService,
		private readonly aiChatFinalSummaryService: AIChatFinalSummaryService,
		private readonly conversationFinalSummaryService: ConversationFinalSummaryService
	) {
		this.state = new InitialState(this)
		this.log = this.log.child({ tenantId })
	}

	async ensureAIConfiguredOrNotify(): Promise<boolean> {
		try {
			const { aiTokenApi } = await this.tenantRepository.getSettings(
				this.tenantId
			)
			if (!aiTokenApi) {
				await this.sendMessage(
					'⚙️ *Recursos de IA indisponíveis no momento.* Tente novamente em breve.'
				)
				return false
			}
			return true
		} catch {
			await this.sendMessage(
				'⚙️ *Recursos de IA indisponíveis no momento.* Tente novamente em breve.'
			)
			return false
		}
	}

	async startAIChatSession(): Promise<void> {
		if (!this.actorPhone) return
		try {
			this.log.info('ai_chat_starting', { phone: this.actorPhone })
			const aiSessionId = await this.aiChatRepository.start(
				this.tenantId,
				this.actorPhone
			)
			this.aiSessionId = aiSessionId
			this.log.info('ai_chat_started', { aiSessionId })
			this.log.info('ai_chat_started', { aiSessionId })
		} catch (err) {
			this.log.error('ai_chat_start_error', { phone: this.actorPhone, err })
		}
	}

	async endAIChatSession(reason: AIChatEndReason = 'COMPLETED'): Promise<void> {
		if (!this.actorPhone) return
		try {
			this.log.info('ai_chat_ending', { phone: this.actorPhone, reason })
			await this.aiChatRepository.end(this.tenantId, this.actorPhone, reason)

			// Gera e persiste resumo final da sessão de IA recém-encerrada (best-effort)
			try {
				await this.aiChatFinalSummaryService.summarizeLatestEndedSession(
					this.tenantId,
					this.actorPhone
				)
			} catch {}

			// Limpa lastResponseId da conversa encerrada no snapshot persistido
			try {
				const snap = await this.stateStore.load(this.tenantId, this.actorPhone)
				if (snap) {
					const currentConv = this.aiSessionId
					const data = snap.data as
						| { lastResponseByConversation?: Record<string, string> }
						| undefined
					if (currentConv && data?.lastResponseByConversation) {
						delete data.lastResponseByConversation[currentConv]
					}
					await this.stateStore.save(
						this.tenantId,
						this.actorPhone,
						snap.state,
						data,
						null
					)
				}
			} catch (err) {
				this.log.error('ai_chat_purge_last_response_failed', { err })
			}
			this.aiSessionId = null
			this.log.info('ai_chat_ended', { phone: this.actorPhone, reason })
		} catch (err) {
			this.log.error('ai_chat_end_error', { phone: this.actorPhone, err })
		}
	}

	async appendAIChatMessage(
		sender: 'USER' | 'AI',
		text: string
	): Promise<void> {
		if (!this.actorPhone) return
		try {
			this.log.info('ai_chat_append_message', {
				phone: this.actorPhone,
				sender,
			})
			await this.aiChatRepository?.appendMessage(
				this.tenantId,
				this.actorPhone,
				sender,
				text
			)
		} catch (err) {
			this.log.error('ai_chat_append_message_failed', { err })
		}
	}

	async receive(message: string): Promise<void> {
		this.log.info('incoming_message', {
			from: this.actorPhone,
			state: this.getCurrentStateName(),
		})
		this.log.info('incoming_message_console', {
			from: this.actorPhone,
			state: this.getCurrentStateName(),
		})
		try {
			await this.state.handle(message)
		} catch (err) {
			this.log.error('process_message_error', { err })
			await this.sendMessage(
				'Estamos com problemas no nosso atendimento, tente novamente mais tarde.'
			)
		}
		// Persistência agora só ocorre quando o estado muda (em transitionTo)
	}

	/**
	 * Ingestão de conta de energia em PDF: processa e encaminha o resumo para a IA
	 * (somente faz sentido quando em IA). A lógica de extração/truncamento ocorre
	 * na porta de IA, para manter o webhook fino e centralizar heurísticas.
	 */
	async ingestEnergyBillPdf(
		mediaId: string,
		filename?: string | null
	): Promise<void> {
		try {
			this.log.info('ingest_energy_pdf_start', { mediaId, filename })
			const { summary, complete, missingFields } =
				await this.energyBillIngestionService.processEnergyBillPdf(
					this.tenantId,
					mediaId,
					filename ?? null
				)
			this.log.info('ingest_energy_pdf_result', {
				complete,
				missingCount: missingFields?.length ?? 0,
				summaryLen: summary?.length ?? 0,
			})
			await this.receive(summary)
			if (!complete) {
				const hint = missingFields?.length
					? `Campos possivelmente ausentes: ${missingFields.join(', ')}.`
					: ''
				await this.sendMessage(
					`Observação: não consegui extrair todos os dados da sua conta de energia. ${hint} Caso possível, reenvie o PDF (com todas as páginas) para melhorar a análise.`.trim()
				)
			}
		} catch (err) {
			this.log.error('ingest_energy_pdf_failed', { err })
			await this.sendMessage(
				'Tive um problema ao processar seu PDF. Tente novamente.'
			)
		}
	}

	transitionTo(state: State): void {
		const newStateName = state.getName()
		this.log.info('state_transition', {
			from: this.getCurrentStateName(),
			to: newStateName,
		})
		this.log.info('state_transition_console', {
			from: this.getCurrentStateName(),
			to: newStateName,
		})
		this.state = state
		void this.maybePersistOnStateChange()
	}

	/** Dados "fixos" disponíveis para qualquer estado */
	getSessionId(): string {
		return this.tenantId
	}

	/** Define/atualiza o ator atual (nome/telefone) e avalia se é funcionário */
	async setActor(name: string, phone: string): Promise<void> {
		this.actorPhone = phone
		this.log = this.log.child({ phone })
		this.log.info('setting_actor', { name, phone })
		const emp = await this.employeeRepository.findByPhone(this.tenantId, phone)
		this.actorIsEmployee = !!emp
		this.actorEmployeeDept = emp?.departmentName ?? null
		this.actorName = emp?.name ?? name
		if (!this.actorIsEmployee) {
			try {
				await this.customerRepository.upsert(this.tenantId, phone, name)
			} catch (err) {
				this.log.error('upsert_customer_failed', { err })
			}
		}
		this.log.info('actor_set_console', {
			isEmployee: this.actorIsEmployee,
			department: this.actorEmployeeDept,
		})
		this.log.info('actor_set', {
			isEmployee: this.actorIsEmployee,
			department: this.actorEmployeeDept,
		})
	}

	getActorPhone(): string | null {
		return this.actorPhone
	}

	/** Apenas para depuração: nome do estado atual */
	getCurrentStateName(): string {
		try {
			return this.state.getName()
		} catch {
			return 'unknown'
		}
	}

	isEmployee(): boolean {
		return this.actorIsEmployee
	}

	isClient(): boolean {
		return !this.actorIsEmployee
	}

	getEmployeeDepartment(): string | null {
		return this.actorEmployeeDept
	}

	getActorName(): string {
		return this.actorName
	}

	/** Retorna a conversa ativa do ator atual, se existir */
	async getActiveConversation(): Promise<ActiveConversation | null> {
		if (!this.actorPhone) return null
		if (this.isEmployee()) {
			return this.conversationRepository.findActiveByEmployeePhone(
				this.tenantId,
				this.actorPhone
			)
		}
		return this.conversationRepository.findActiveByCustomerPhone(
			this.tenantId,
			this.actorPhone
		)
	}

	async makeAIResponse(
		conversationId: string,
		text: string,
		lastResponseId?: string | null
	) {
		const role = this.isEmployee() ? 'EMPLOYEE' : 'CLIENT'
		this.log.info('making_ai_response', {
			userPhone: this.actorPhone,
			conversationId,
			role,
		})
		const res = await this.aiResponse.makeResponse({
			tenantId: this.tenantId,
			userPhone: this.actorPhone ?? 'unknown',
			role,
			text,
			conversationId,
			lastResponseId: lastResponseId ?? undefined,
		})
		this.log.info('ai_response_generated', { responseId: res.responseId })
		return res
	}

	/**
	 * Consulta "ao vivo" às categorias do FAQ.
	 */
	async fetchFaqCategories(): Promise<string[]> {
		return this.faqRepository.getCategoriesForTenant(this.tenantId)
	}

	/** Consulta perguntas de uma categoria específica. */
	async fetchFaq(category: string) {
		return this.faqRepository.getFaqForCategory(this.tenantId, category)
	}

	/** Lista departamentos cadastrados para a sessão atual */
	async fetchDepartments(): Promise<string[]> {
		return this.departmentRepository.listDepartments(this.tenantId)
	}

	/** Enfileira o cliente no departamento escolhido */
	async enqueueInDepartment(departmentName: string): Promise<void> {
		const phone = this.actorPhone
		if (!phone) throw new Error('Ator sem telefone definido')
		// Reforço de segurança: impedir enfileiramento de funcionários
		if (this.isEmployee()) {
			throw new Error('Funcionários não podem entrar na fila de departamentos')
		}
		return this.departmentRepository.enqueueCustomer(
			this.tenantId,
			departmentName,
			phone
		)
	}

	async listDepartmentQueue(departmentName: string) {
		return this.departmentRepository.listQueue(this.tenantId, departmentName)
	}

	/** Resolve nomes de clientes por telefone */
	async resolveCustomerNames(phones: string[]): Promise<Map<string, string>> {
		if (!phones.length) return new Map<string, string>()
		const rows = await this.customerRepository.findByPhones(
			this.tenantId,
			phones
		)
		return new Map(rows.map(r => [r.phone, r.name]))
	}

	/** Verifica se o cliente atual está em alguma fila */
	async findCurrentQueueDepartment(): Promise<string | null> {
		const phone = this.actorPhone
		if (!phone) return null
		return this.departmentRepository.findCustomerQueueDepartment(
			this.tenantId,
			phone
		)
	}

	/** Remove o cliente da fila de um departamento */
	async leaveQueue(
		departmentName: string,
		customerPhone: string
	): Promise<void> {
		await this.departmentRepository.leaveQueue(
			this.tenantId,
			departmentName,
			customerPhone
		)
	}

	/** Envia uma mensagem de saída para o ator atual via WhatsApp */
	async sendMessage(message: string): Promise<void> {
		const to = this.actorPhone
		if (!to) return
		await this.messaging.sendText(this.tenantId, to, message)
	}

	/** Envia o menu inicial como lista interativa do WhatsApp */
	async showInitialMenu(): Promise<void> {
		const to = this.actorPhone
		if (!to) return

		const rows: { id: string; title: string; description?: string }[] = [
			{ id: 'faq', title: 'FAQ' },
			{ id: 'conversar com ia', title: 'Conversar com IA' },
		]

		if (this.isClient()) {
			rows.push({ id: 'departamentos', title: 'Departamentos' })
		}
		if (this.isEmployee()) {
			rows.push({ id: 'ver fila', title: 'Ver fila' })
			rows.push({ id: 'atender', title: 'Atender' })
		}

		const sections: MsgListSection[] = [{ title: 'Opções', rows }]

		await this.messaging.sendList(
			this.tenantId,
			to,
			'*Selecione uma opção:*',
			'Menu',
			sections
		)
	}

	/** Persiste somente quando o estado mudar (transitionTo) */
	private async maybePersistOnStateChange(): Promise<void> {
		const phone = this.actorPhone
		if (!phone) return
		const name = this.state.getName()
		if (name === this.lastPersistedStateName) return
		const data = this.state.getSnapshot?.()
		await this.stateStore.save(
			this.tenantId,
			phone,
			name,
			data,
			this.aiSessionId
		)
		this.lastPersistedStateName = name
	}

	/**
	 * Persiste imediatamente o snapshot do estado atual.
	 * Use quando for necessário salvar dados voláteis (ex.: lastResponseId) sem troca de estado.
	 */
	async persistSnapshotNow(): Promise<void> {
		const phone = this.actorPhone
		if (!phone) return
		const name = this.state.getName()
		const data = this.state.getSnapshot?.()
		await this.stateStore.save(
			this.tenantId,
			phone,
			name,
			data,
			this.aiSessionId
		)
		this.lastPersistedStateName = name
	}

	/** Envia o menu de departamentos como lista interativa do WhatsApp */
	async showDepartmentsMenu(): Promise<void> {
		const to = this.actorPhone
		if (!to) return
		const departments = await this.fetchDepartments()
		const actionRows: { id: string; title: string; description?: string }[] = [
			{ id: 'voltar', title: 'Voltar' },
		]
		const deptRows = departments.map(name => ({ id: name, title: name }))
		const sections: MsgListSection[] = []
		sections.push({ title: 'Ações', rows: actionRows })
		if (deptRows.length > 0)
			sections.push({ title: 'Departamentos', rows: deptRows })
		await this.messaging.sendList(
			this.tenantId,
			to,
			'Escolha um departamento:',
			'Departamentos',
			sections
		)
	}

	/** Restaura o estado a partir de um nome conhecido */
	setStateByName(
		name: string,
		data?: {
			category?: string
			customerPhone?: string
			lastResponseId?: string
			lastResponseByConversation?: Record<string, string>
		}
	): void {
		switch (name) {
			case 'initial':
				this.state = new InitialState(this)
				break
			case 'faq_menu':
				this.state = new FaqMenuState(this)
				break
			case 'department_menu':
				this.state = new DepartmentMenuState(this)
				break
			case 'faq_category': {
				const category = data?.category
				this.state = category
					? new FaqCategoryState(this, category)
					: new FaqMenuState(this)
				break
			}
			case 'in_conversation': {
				const customerPhone = data?.customerPhone
				if (customerPhone) {
					this.state = new InConversationState(this, customerPhone)
				} else {
					this.state = new InitialState(this)
				}
				break
			}
			case 'ai_chat': {
				let restored: string | null = null
				const currentConv = this.aiSessionId ?? null
				if (currentConv && data && typeof data === 'object') {
					const map = (
						data as { lastResponseByConversation?: Record<string, string> }
					).lastResponseByConversation
					if (map && typeof map[currentConv] === 'string') {
						restored = map[currentConv]
					}
				}
				if (!restored) restored = data?.lastResponseId ?? null
				this.state = new AIChatState(this, restored)
				break
			}
			default:
				this.state = new InitialState(this)
		}
		this.lastPersistedStateName = name
	}

	/** Inicia atendimento pegando o próximo da fila do departamento do funcionário */
	async startNextService(): Promise<string> {
		if (!this.isEmployee()) return 'Opção disponível apenas para funcionários.'
		const dept = this.getEmployeeDepartment()
		if (!dept) return 'Você não está atribuído a nenhum departamento.'

		const next = await this.departmentRepository.dequeueNext(
			this.tenantId,
			dept
		)
		if (!next) return `🔔 *Fila do departamento ${dept}: vazia.*`
		const convo = await this.conversationRepository.start(
			this.tenantId,
			this.actorPhone!,
			next.customerPhone,
			next.createdAt
		)
		// Link any recent/open AI chat session as escalated
		try {
			await this.aiChatRepository.endAndLink(
				this.tenantId,
				next.customerPhone,
				convo.id,
				'ESCALATED'
			)
			try {
				await this.aiChatFinalSummaryService.summarizeLatestEndedSession(
					this.tenantId,
					next.customerPhone
				)
			} catch {}
		} catch {}

		// Atualiza snapshot do cliente para refletir 'in_conversation'
		if (this.stateStore) {
			try {
				await this.stateStore.save(
					this.tenantId,
					next.customerPhone,
					'in_conversation',
					{ customerPhone: next.customerPhone },
					null
				)
			} catch {}
		}
		// Entra em estado de conversa
		this.transitionTo(new InConversationState(this, next.customerPhone))
		// Resolve nome do cliente para mensagem amigável
		let displayName = next.customerPhone
		try {
			const rows = await this.customerRepository.findByPhones(this.tenantId, [
				next.customerPhone,
			])
			if (rows && rows.length > 0)
				displayName = rows[0].name || next.customerPhone
		} catch {}
		return `✅ *Iniciando atendimento do cliente* ${displayName} - ${next.customerPhone}.`
	}

	/** Inicia conversa proativa com um telefone específico (funcionário) */
	async startConversationWith(customerPhone: string): Promise<void> {
		if (!this.isEmployee() || !this.actorPhone) return
		// Não permitir iniciar conversa com outro funcionário
		try {
			const maybeEmployee = await this.employeeRepository.findByPhone(
				this.tenantId,
				customerPhone
			)
			if (maybeEmployee) {
				await this.sendMessage(
					'⛔️ *Não é possível iniciar atendimento com um funcionário.* Informe um número de cliente.'
				)
				return
			}
		} catch {}
		const convo = await this.conversationRepository.start(
			this.tenantId,
			this.actorPhone,
			customerPhone
		)
		try {
			await this.aiChatRepository.endAndLink(
				this.tenantId,
				customerPhone,
				convo.id,
				'ESCALATED'
			)
			try {
				await this.aiChatFinalSummaryService.summarizeLatestEndedSession(
					this.tenantId,
					customerPhone
				)
			} catch {}
		} catch {}
		if (this.stateStore) {
			try {
				await this.stateStore.save(
					this.tenantId,
					customerPhone,
					'in_conversation',
					{ customerPhone },
					null
				)
			} catch {}
		}
		this.transitionTo(new InConversationState(this, customerPhone))
	}

	/** Encaminha mensagem de funcionário para o cliente ativo (se houver) */
	async forwardFromEmployee(message: string): Promise<boolean> {
		if (!this.isEmployee() || !this.actorPhone) return false
		const active = await this.conversationRepository.findActiveByEmployeePhone(
			this.tenantId,
			this.actorPhone
		)
		if (!active) return false
		const header = `*Funcionário ${active.employeeName}${active.departmentName ? ` - ${active.departmentName}` : ''}*`
		await this.messaging.sendText(
			this.tenantId,
			active.customerPhone,
			`${header}\n${message}`
		)
		await this.conversationRepository.appendMessage(
			active.id,
			'EMPLOYEE',
			message
		)
		return true
	}

	/** Encaminha mensagem de cliente para o funcionário ativo (se houver) */
	async forwardFromCustomer(
		message: string,
		customerName: string
	): Promise<boolean> {
		if (this.isEmployee() || !this.actorPhone) return false
		const active = await this.conversationRepository.findActiveByCustomerPhone(
			this.tenantId,
			this.actorPhone
		)
		if (!active) return false
		const header =
			`*Cliente - ${customerName} (${active.customerPhone})*`.trim()
		await this.messaging.sendText(
			this.tenantId,
			active.employeePhone,
			`${header}\n${message}`
		)
		await this.conversationRepository.appendMessage(
			active.id,
			'CUSTOMER',
			message
		)
		return true
	}

	/** Finaliza conversa ativa do funcionário (se houver) e avisa cliente */
	async finishConversationByEmployee(
		resolution: $Enums.ConversationResolution = 'RESOLVED'
	): Promise<string> {
		if (!this.isEmployee() || !this.actorPhone)
			return '🔒 *Opção disponível apenas para funcionários.*'
		const ended =
			resolution === 'RESOLVED'
				? await this.conversationRepository.endByEmployeePhone(
						this.tenantId,
						this.actorPhone
					)
				: await this.conversationRepository.endByEmployeePhoneWithResolution(
						this.tenantId,
						this.actorPhone,
						'UNRESOLVED'
					)
		if (!ended) return 'ℹ️ *Você não tem conversa ativa.*'

		// Best-effort: gerar resumo final desta conversa recém-encerrada
		try {
			await this.conversationFinalSummaryService.summarizeConversation(
				this.tenantId,
				ended.id
			)
		} catch {}
		await this.messaging.sendText(
			this.tenantId,
			ended.customerPhone,
			resolution === 'RESOLVED'
				? '✅ *A conversa foi finalizada.*'
				: '⚠️ *A conversa foi finalizada como não resolvida.*'
		)
		return resolution === 'RESOLVED'
			? '✅ *Conversa finalizada.*'
			: '⚠️ *Conversa finalizada como não resolvida.*'
	}

	/** Envia o menu de categorias do FAQ como lista interativa */
	async showFaqCategoriesMenu(): Promise<void> {
		const to = this.actorPhone
		if (!to) return
		const categories = await this.fetchFaqCategories()

		const actionRows: { id: string; title: string; description?: string }[] = [
			{ id: 'voltar', title: 'Voltar' },
		]
		const categoryRows = categories.map(name => ({ id: name, title: name }))

		const sections: MsgListSection[] = []
		sections.push({ title: 'Ações', rows: actionRows })
		if (categoryRows.length > 0) {
			sections.push({ title: 'Categorias', rows: categoryRows })
		}

		await this.messaging.sendList(
			this.tenantId,
			to,
			'Escolha uma categoria:',
			'Categorias',
			sections
		)
	}
}
