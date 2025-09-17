import { CustomerServiceContext } from '../CustomerServiceContext'
import { State } from '../State'
import { FaqMenuState } from './FaqMenuState'
import { DepartmentMenuState } from './DepartmentMenuState'
import { InConversationState } from './InConversationState'
import { WaitingInQueueState } from './WaitingInQueueState'
import { AIChatState } from './AIChatState'
import { dayjs } from '@/config/date-and-time/dayjs'

/**
 * Estado inicial do fluxo de atendimento.
 */
export class InitialState implements State {
	constructor(private readonly context: CustomerServiceContext) {}

	async handle(message: string): Promise<void> {
		const input = message.trim().toLowerCase()

		// Se há conversa ativa, delega para o estado de conversa
		const active = await this.context.getActiveConversation()
		if (active) {
			const next = new InConversationState(this.context, active.customerPhone)
			this.context.transitionTo(next)
			await next.handle(message)
			return
		}

		// Se cliente está em fila (e não em conversa), mantém estado de espera
		if (this.context.isClient()) {
			const queuedDept = await this.context.findCurrentQueueDepartment()
			if (queuedDept) {
				const next = new WaitingInQueueState(this.context, queuedDept)
				this.context.transitionTo(next)
				await next.handle(message)
				return
			}
		}
		if (input === 'faq') {
			this.context.transitionTo(new FaqMenuState(this.context))
			await this.context.showFaqCategoriesMenu()
			return
		}

		if (input === 'departamentos' || input === 'departamento') {
			// Reforço de permissão: somente clientes podem acessar Departamentos
			if (!this.context.isClient()) {
				await this.context.sendMessage(
					'🔒 *Opção disponível apenas para clientes.*'
				)
				await this.context.showInitialMenu()
				return
			}
			this.context.transitionTo(new DepartmentMenuState(this.context))
			const departments = await this.context.fetchDepartments()
			if (departments.length === 0) {
				await this.context.sendMessage('ℹ️ *Não há departamentos cadastrados.*')
				await this.context.showInitialMenu()
				return
			}
			await this.context.showDepartmentsMenu()
			return
		}

		if (input === 'ver fila') {
			if (!this.context.isEmployee()) {
				await this.context.sendMessage(
					'🔒 *Opção disponível apenas para funcionários.*'
				)
				await this.context.showInitialMenu()
				return
			}

			const dept = this.context.getEmployeeDepartment()
			if (!dept) {
				await this.context.sendMessage(
					'⚠️ *Você não está atribuído a nenhum departamento.*'
				)
				await this.context.showInitialMenu()
				return
			}

			const entries = await this.context.listDepartmentQueue(dept)
			if (entries.length === 0) {
				await this.context.sendMessage(
					`🔔 *Fila do departamento ${dept}: vazia.*`
				)
				await this.context.showInitialMenu()
				return
			}

			// Resolve nomes dos clientes e formata data/hora com dayjs configurado
			const phones = entries.map(e => e.customerPhone)
			const nameByPhone = await this.context.resolveCustomerNames(phones)
			const lines = entries.map((e, i) => {
				const name = nameByPhone.get(e.customerPhone) || e.customerPhone
				const when = dayjs(e.createdAt).format('DD/MM/YYYY HH:mm')
				return `👤 ${name} - ${e.customerPhone} - ${when}`
			})
			await this.context.sendMessage(
				`*Fila do departamento ${dept}:*\n${lines.join('\n')}`
			)
			await this.context.showInitialMenu()
			return
		}

		if (input === 'atender') {
			if (!this.context.isEmployee()) {
				await this.context.sendMessage(
					'🔒 *Opção disponível apenas para funcionários.*'
				)
				return
			}
			const msg = await this.context.startNextService()
			await this.context.sendMessage(msg)
			return
		}

		// Comando para iniciar conversa proativa: "iniciar <phone>"
		if (this.context.isEmployee() && input.startsWith('iniciar')) {
			const phone = message.replace(/^\s*iniciar\s*/i, '').replace(/\D+/g, '')
			if (!phone) {
				await this.context.sendMessage(
					'☎️ *Informe um telefone válido.* Ex.: iniciar 5511999990001'
				)
				await this.context.showInitialMenu()
				return
			}
			await this.context.startConversationWith(phone)
			await this.context.sendMessage(
				`✅ *Você iniciou um atendimento com o cliente* ${phone}.`
			)
			return
		}

		if (input === 'conversar com ia' || input === 'ia') {
			const ok = await this.context.ensureAIConfiguredOrNotify()
			if (!ok) return
			await this.context.startAIChatSession()
			this.context.transitionTo(new AIChatState(this.context))
			await this.context.sendMessage(
				'🤖 *Conversa com IA iniciada.* Envie sua mensagem. Para sair, digite "!finalizar".'
			)
			return
		}
		await this.context.showInitialMenu()
	}

	getName(): string {
		return 'initial'
	}

	getSnapshot(): unknown {
		return undefined
	}
}
