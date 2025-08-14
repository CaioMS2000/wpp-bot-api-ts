import path from 'node:path'
import { logger } from '@/logger'
import { Conversation } from '@/entities/conversation'
import { Message } from '@/entities/message'
import { SenderType, UserType } from '@/@types'
import { AIService } from '@/modules/whats-app/services/ai-service'
import { env } from '@/env'
import { appendToLogFile, findProjectRoot } from '@/utils/files'
import { OpenAI } from 'openai'
import { z } from 'zod'
import { systemInstructions } from '../constants'
import { saveUserDataTool } from './functions/collect-user-data'
import {
	Tool,
	ResponseInput,
	FunctionCallSchema,
	FunctionRegistry,
} from '../types'
import { functionRegistry } from './functions/registry'
import { ConversationService } from '@/modules/whats-app/services/conversation-service'
import { UserService } from '@/modules/whats-app/services/user-service'

export class AIResponseService extends AIService {
	private client: OpenAI
	private tools: Tool[] = []

	constructor(
		private conversationService: ConversationService,
		private userService: UserService
	) {
		super()

		this.client = new OpenAI({
			apiKey: env.OPENAI_API_KEY,
			logLevel: 'debug',
			maxRetries: 0,
		})

		this.setupTools()
	}

	private async buildInstructions(conversation: Conversation): Promise<string> {
		let instructions = `${systemInstructions}\n**Informações de contexto/sessão**`

		if (conversation.userType === UserType.CLIENT) {
			const client = await this.userService.getClient(
				conversation.companyId,
				conversation.userId,
				{ notNull: true }
			)
			instructions +=
				'\nVocê está conversando com um cliente. De acordo com a base de dados essas são as informações que temos:\n'
			instructions += `${JSON.stringify({ phone: client.phone, name: client.name }, null, 2)}\n`
			instructions +=
				'Se tiver alguma informação nula ou faltando, solicite ao cliente.'
		} else if (conversation.userType === UserType.EMPLOYEE) {
		}

		return instructions
	}

	private async answer(
		conversation: Conversation,
		input: ResponseInput,
		lastResponseId: Nullable<string> = null
	) {
		const instructions = await this.buildInstructions(conversation)
		return await this.client.responses.create({
			model: 'gpt-4o-mini',
			store: true,
			input,
			previous_response_id: lastResponseId,
			instructions: instructions,
			tools: this.tools,
		})
	}

	private async generateResponse(
		conversation: Conversation,
		input: ResponseInput,
		lastResponseId: Nullable<string> = null
	) {
		let inputs: ResponseInput

		if (typeof input === 'string') {
			inputs = [
				{
					role: 'user',
					content: input,
				},
			]
		} else {
			inputs = input
		}

		const response = await this.answer(conversation, inputs, lastResponseId)
		const projectRoot = findProjectRoot(__dirname)
		const savePath = path.join(projectRoot, 'openai-responses.json')

		appendToLogFile(savePath, response)

		const toolCalls = (response.output ?? []).filter(
			(out): out is z.infer<typeof FunctionCallSchema> => {
				try {
					FunctionCallSchema.parse(out)
					return true
				} catch {
					return false
				}
			}
		)

		if (toolCalls.length > 0) {
			for (const call of toolCalls) {
				const args: Record<string, unknown> = JSON.parse(call.arguments)
				let output: string

				const registryEntry: Nullable<FunctionRegistry> =
					functionRegistry[call.name] ?? null

				if (registryEntry) {
					const data = registryEntry.schema.parse(args)
					output = await registryEntry.fn(data)
				} else {
					output = `Não foi possível processar a solicitação. Função '${call.name}' não está registrada`
				}

				inputs.push(call)
				inputs.push({
					type: 'function_call_output',
					call_id: call.call_id,
					output,
				})
			}

			const followup = await this.answer(conversation, inputs, lastResponseId)

			appendToLogFile(savePath, followup)

			return { message: followup.output_text, responseId: followup.id }
		}

		return { message: response.output_text, responseId: response.id }
	}

	async makeResponse(conversation: Conversation, message: Message) {
		try {
			logger.debug(
				'[AIResponseService] Generating response for message: ',
				message.content
				// this.client.
			)
			const messages = conversation.messages.toReversed()
			const lastGeneratedByAIResponse = messages.find(
				message =>
					!!message.aiResponseId && message.senderType === SenderType.AI
			)
			let input = message.content
			let lastResponseId: Nullable<string> = lastGeneratedByAIResponse
				? lastGeneratedByAIResponse.aiResponseId
				: null

			if (conversation.messages.length > 20) {
				const resume = await this.generateResponse(
					conversation,
					'Resuma tudo que conversamos até momento.'
				)
				input = `Esse é o resumo da nossa conversa até o momento:\n${resume}\n\nAgora me reponda o seguinte:\n${message}`
				lastResponseId = null
			}

			const result = await this.generateResponse(
				conversation,
				input,
				lastResponseId
			)
			const newMessage = Message.create({
				conversationId: conversation.id,
				senderType: SenderType.AI,
				content: result.message,
				aiResponseId: result.responseId,
			})

			conversation.messages.push(newMessage)
			await this.conversationService.save(conversation)

			return newMessage
		} catch (error) {
			if (error instanceof Error) {
				logger.error(`${error.message}`)
				logger.debug(error.stack)
			} else {
				logger.debug(error)
			}

			throw error
		}
	}

	private setupTools() {
		this.tools.push(saveUserDataTool)
	}
}
