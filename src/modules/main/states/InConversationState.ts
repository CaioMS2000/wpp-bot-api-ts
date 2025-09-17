import { CustomerServiceContext } from '../CustomerServiceContext'
import { State } from '../State'
import { InitialState } from './InitialState'

/**
 * Estado de conversa ativa entre funcionário e cliente.
 * Encaminha mensagens entre as partes e trata finalização.
 */
export class InConversationState implements State {
	constructor(
		private readonly context: CustomerServiceContext,
		private readonly customerPhone: string
	) {}

	async handle(message: string): Promise<void> {
		const trimmed = message.trim().toLowerCase()

		if (this.context.isEmployee()) {
			if (trimmed === '!finalizar') {
				const msg = await this.context.finishConversationByEmployee()
				await this.context.sendMessage(msg)
				this.context.transitionTo(new InitialState(this.context))
				await this.context.showInitialMenu()
				return
			}
			if (
				trimmed === '!finalizar não resolvido' ||
				trimmed === '!finalizar nao resolvido'
			) {
				const msg =
					await this.context.finishConversationByEmployee('UNRESOLVED')
				await this.context.sendMessage(msg)
				this.context.transitionTo(new InitialState(this.context))
				await this.context.showInitialMenu()
				return
			}
			const forwarded = await this.context.forwardFromEmployee(message)
			if (!forwarded) {
				await this.context.sendMessage('ℹ️ *Nenhuma conversa ativa encontrada.*')
				this.context.transitionTo(new InitialState(this.context))
				await this.context.showInitialMenu()
			}
			return
		}

		// Cliente em conversa ativa
		const forwarded = await this.context.forwardFromCustomer(
			message,
			this.context.getActorName()
		)
		if (!forwarded) {
			// Se não encontrou conversa ativa, volta ao menu
			this.context.transitionTo(new InitialState(this.context))
			await this.context.showInitialMenu()
		}
	}

	getName(): string {
		return 'in_conversation'
	}

	getSnapshot(): unknown {
		return { customerPhone: this.customerPhone }
	}
}
