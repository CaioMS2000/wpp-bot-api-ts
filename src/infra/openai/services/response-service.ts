import util from 'node:util'
import path from 'node:path'
import { logger } from '@/core/logger'
import { Conversation } from '@/domain/entities/conversation'
import { Message } from '@/domain/entities/message'
import { ConversationRepository } from '@/domain/repositories/conversation-repository'
import { AIService } from '@/domain/whats-app/application/services/ai-service'
import { env } from '@/env'
import { OpenAI } from 'openai'
import { systemInstructions } from '../constants'
import { appendToLogFile, findProjectRoot } from '@/utils/files'
import { SenderType } from '@/domain/whats-app/@types'

type Tool = OpenAI.Responses.Tool
type FunctionTool = OpenAI.Responses.FunctionTool

export class AIResponseService extends AIService {
	private client: OpenAI
	constructor(
		conversationRepository: ConversationRepository,
		private tools: Tool[] = []
	) {
		super(conversationRepository)

		this.client = new OpenAI({
			apiKey: env.OPENAI_API_KEY,
			logLevel: 'debug',
			maxRetries: 0,
		})

		this.setupTools()
	}

	private async generateResponse(
		input: string,
		lastResponseId: Nullable<string> = null
	) {
		const response = await this.client.responses.create({
			model: 'gpt-4o-mini',
			store: true,
			input,
			previous_response_id: lastResponseId,
			instructions: systemInstructions,
			tools: this.tools,
		})
		const projectRoot = findProjectRoot(__dirname)
		const savePath = path.join(projectRoot, 'openai-responses.json')

		appendToLogFile(savePath, response)

		return { message: response.output_text, responseId: response.id }
	}

	async makeResponse(conversation: Conversation, message: Message) {
		logger.debug(
			'[AIResponseService] Generating response for message: ',
			message.content
			// this.client.
		)
		const messages = conversation.messages.toReversed()
		const lastGeneratedByAIResponse = messages.find(
			message => !!message.aiResponseId && message.senderType === SenderType.AI
		)
		let input = message.content
		let lastResponseId: Nullable<string> = lastGeneratedByAIResponse
			? lastGeneratedByAIResponse.aiResponseId
			: null

		if (conversation.messages.length > 20) {
			const resume = await this.generateResponse(
				'Resuma tudo que conversamos até momento.'
			)
			input = `Esse é o resumo da nossa conversa até o momento:\n${resume}\n\nAgora me reponda o seguinte:\n${message}`
			lastResponseId = null
		}

		const result = await this.generateResponse(input, lastResponseId)
		const newMessage = Message.create({
			conversationId: conversation.id,
			senderType: SenderType.AI,
			content: result.message,
			aiResponseId: result.responseId,
		})

		conversation.messages.push(newMessage)
		await this.conversationRepository.save(conversation)

		return newMessage
	}

	private setupTools() {
		const collectUserData: FunctionTool = {
			name: 'collectUserData',
			parameters: {
				type: 'object',
				properties: {
					name: { type: 'string' },
					email: { type: 'string' },
				},
			},
			type: 'function',
			description: '',
			strict: true,
		}

		this.tools.push(collectUserData)
	}
}
