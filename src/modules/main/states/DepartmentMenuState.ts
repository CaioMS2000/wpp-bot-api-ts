import { CustomerServiceContext } from '../CustomerServiceContext'
import { State } from '../State'
import { InitialState } from './InitialState'
import { WaitingInQueueState } from './WaitingInQueueState'

/**
 * Estado que lista departamentos disponíveis e permite escolher um para entrar na fila.
 */
export class DepartmentMenuState implements State {
	constructor(private readonly context: CustomerServiceContext) {}

	async handle(message: string): Promise<void> {
		// Reforço de permissão: impedir acesso por funcionários
		if (this.context.isEmployee()) {
			await this.context.sendMessage(
				'🔒 *Opção disponível apenas para clientes.*'
			)
			this.context.transitionTo(new InitialState(this.context))
			await this.context.showInitialMenu()
			return
		}
		const trimmed = message.trim().toLowerCase()

		if (trimmed === 'voltar') {
			this.context.transitionTo(new InitialState(this.context))
			await this.context.showInitialMenu()
			return
		}

		const departments = await this.context.fetchDepartments()
		if (departments.length === 0) {
			await this.context.sendMessage('ℹ️ *Não há departamentos cadastrados.*')
			this.context.transitionTo(new InitialState(this.context))
			await this.context.showInitialMenu()
			return
		}

		const matched = departments.find(d => d.toLowerCase() === trimmed)
		if (matched) {
			try {
				await this.context.enqueueInDepartment(matched)
				await this.context.sendMessage(
					`✅ *Você entrou na fila do departamento: ${matched}.*\nAguarde atendimento. Para sair da fila, digite 'sair'.`
				)
				// Permanecer em estado de espera na fila
				this.context.transitionTo(
					new WaitingInQueueState(this.context, matched)
				)
				return
			} catch {
				await this.context.sendMessage(
					`⛔️ *Departamento "${matched}" indisponível no momento.* Por favor, escolha novamente.`
				)
				await this.context.showDepartmentsMenu()
				return
			}
		}

		await this.context.showDepartmentsMenu()
	}

	getName(): string {
		return 'department_menu'
	}

	getSnapshot(): unknown {
		return undefined
	}
}
