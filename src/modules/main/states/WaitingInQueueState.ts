import { CustomerServiceContext } from '../CustomerServiceContext'
import { State } from '../State'
import { InitialState } from './InitialState'
import { InConversationState } from './InConversationState'

export class WaitingInQueueState implements State {
	constructor(
		private readonly context: CustomerServiceContext,
		private readonly departmentName: string
	) {}

	async handle(message: string): Promise<void> {
		// Reforço: estado de fila não faz sentido para funcionário
		if (this.context.isEmployee()) {
			this.context.transitionTo(new InitialState(this.context))
			await this.context.showInitialMenu()
			return
		}
		const active = await this.context.getActiveConversation()
		if (active) {
			const next = new InConversationState(this.context, active.customerPhone)
			this.context.transitionTo(next)
			await next.handle(message)
			return
		}

		const trimmed = message.trim().toLowerCase()
		if (trimmed === 'sair') {
			const phone = this.context.getActorPhone()
			if (phone) {
				await this.context.leaveQueue(this.departmentName, phone)
			}
			this.context.transitionTo(new InitialState(this.context))
			await this.context.showInitialMenu()
			return
		}
		await this.context.sendMessage(
			"⏳ *Você está na fila de espera.* Aguarde seu atendimento começar. Se quiser sair da fila, digite 'sair'"
		)
	}

	getName(): string {
		return 'waiting_queue'
	}

	getSnapshot(): unknown {
		return { department: this.departmentName }
	}
}
