import { logger as _logger } from '@/infra/logging/logger'
import { CustomerServiceContext } from '../CustomerServiceContext'
import { State } from '../State'
import { InitialState } from './InitialState'

export class AIChatState implements State {
	constructor(
		private readonly context: CustomerServiceContext,
		private lastResponseId: string | null = null
	) {}

	async handle(message: string): Promise<void> {
		const logger = _logger.child({
			component: 'AIChatState',
			tenantId: this.context.getSessionId(),
			phone: this.context.getActorPhone() ?? undefined,
			aiSessionId: this.context.aiSessionId ?? undefined,
		})
		logger.info('ai_state_handle', { size: message.length })
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
			// missing session id already logged via logger.error below
			logger.error('ai_state_missing_session', {})
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
			logger.info('ai_state_requesting_response', {
				lastResponseId: this.lastResponseId,
			})
			res = await this.context.makeAIResponse(
				this.context.aiSessionId,
				message,
				this.lastResponseId
			)
		} catch (err: any) {
			logger.error('ai_state_make_response_error', { err })
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
		logger.info('ai_state_sending_reply', { size: replyText.length })
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
