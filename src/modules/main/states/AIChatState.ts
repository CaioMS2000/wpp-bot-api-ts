import { CustomerServiceContext } from '../CustomerServiceContext'
import { State } from '../State'
import { InitialState } from './InitialState'

export class AIChatState implements State {
	constructor(
		private readonly context: CustomerServiceContext,
		private lastResponseId: string | null = null
	) {}

	async handle(message: string): Promise<void> {
		console.log('[AIChatState] handling message', { message })
		const trimmed = message.trim().toLowerCase()
		if (
			trimmed === 'voltar' ||
			trimmed === '!finalizar' ||
			trimmed === 'finalizar'
		) {
			await this.context.endAIChatSession('COMPLETED')
			this.context.transitionTo(new InitialState(this.context))
			await this.context.showInitialMenu()
			return
		}

		if (!this.context.aiSessionId) {
			console.error(
				"AIChatState should have a valid 'this.context.aiSessionId'"
			)
			return
		}

		// Persist user message in AI session
		await this.context.appendAIChatMessage('USER', message)

		let res: {
			text: string
			responseId?: string | null
			usage?: any
			summarized?: boolean
		}
		try {
			console.log('[AIChatState] requesting AI response', {
				lastResponseId: this.lastResponseId,
			})
			res = await this.context.makeAIResponse(
				this.context.aiSessionId,
				message,
				this.lastResponseId
			)
		} catch (err: any) {
			console.error('[AIChatState] makeAIResponse failed', err)
			const friendly =
				err?.code === 'insufficient_quota' || err?.status === 429
					? '🚫 *IA indisponível no momento* (limite de uso atingido). Tente novamente em alguns minutos.'
					: '⚠️ *Tivemos um problema ao processar sua mensagem.* Tente novamente em instantes.'
			await this.context.sendMessage(friendly)
			return
		}
		// Respeita reset de thread após sumarização: não persiste responseId
		if (res.summarized) {
			this.lastResponseId = null
		} else {
			this.lastResponseId = res.responseId ?? null
		}
		// Persist snapshot com lastResponseId para manter continuidade após reinício
		await this.context.persistSnapshotNow()
		const replyText = res.text || '...'
		// Persist AI reply in AI session
		await this.context.appendAIChatMessage('AI', replyText)
		console.log('[AIChatState] sending AI reply', { replyText })
		await this.context.sendMessage(replyText)
	}

	getName(): string {
		return 'ai_chat'
	}

	getSnapshot(): unknown {
		const convId = this.context.aiSessionId
		if (convId && this.lastResponseId) {
			return {
				lastResponseByConversation: { [convId]: this.lastResponseId },
			}
		}
		// fallback para compatibilidade
		return { lastResponseId: this.lastResponseId }
	}
}
