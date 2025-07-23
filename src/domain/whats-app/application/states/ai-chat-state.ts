import { logger } from '@/core/logger'
import { OutputPort } from '@/core/output/output-port'
import { Conversation } from '@/domain/entities/conversation'
import { Message } from '@/domain/entities/message'
import { AIService } from '@/domain/whats-app/application/services/ai-service'
import { execute } from '@caioms/ts-utils/functions'
import { User } from '../../@types'
import { ConversationState } from './conversation-state'
import { StateTransitionIntention } from './types'

type AIChatStateProps = {
	conversation: Conversation
	user: User
}

export class AIChatState extends ConversationState<AIChatStateProps> {
	constructor(
		outputPort: OutputPort,
		conversation: Conversation,
		user: User,
		private aiService: AIService
	) {
		super(outputPort, { conversation, user })
	}

	get conversation() {
		return this.props.conversation
	}

	get user() {
		return this.props.user
	}

	async handleMessage(
		message: Message
	): Promise<Nullable<StateTransitionIntention>> {
		try {
			const response = await this.aiService.makeResponse(
				this.conversation,
				message
			)

			await execute(this.outputPort.handle, this.user, {
				type: 'text',
				content: `*Evo*\n${response.content}`,
			})

			return null
		} catch (error) {
			logger.error(error)
			throw error
		}
	}

	async onEnter() {
		await execute(this.outputPort.handle, this.user, {
			type: 'text',
			content: `*Evo*\nOlá, eu sou a EVO, a Inteligência Artificial da Evolight e estou aqui para te ajudar. Que tal começar enviando uma fatura de energia para análise ou perguntando sobre a Evolight? 

Para finalizar a conversa, basta enviar "Finalizar".

  -As respostas podem levar algum tempo para ser geradas.
  -Aguarde a resposta antes de enviar outra mensagem.
  -Essa funcionalidade ainda está em fase de testes, eventuais erros podem ocorrer.`,
		})
	}

	async onExit() {
		await execute(this.outputPort.handle, this.user, {
			type: 'text',
			content: '*Conversa finalizada.*',
		})
	}
}
