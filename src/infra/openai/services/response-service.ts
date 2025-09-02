import path from 'node:path'
import { SenderType, UserType } from '@/@types'
import { env } from '@/config/env'
import { Conversation } from '@/entities/conversation'
import { Message } from '@/entities/message'
import { UnsupportedFileTypeError } from '@/errors/errors/unsupported-file-type-error'
import { UnsupportedMessageTypeError } from '@/errors/errors/unsupported-message-type-error'
import { openAIClient } from '@/lib/openai'
import { logger } from '@/logger'
import { WppIncomingContent } from '@/modules/whats-app/@types/messages'
import { AIService } from '@/modules/whats-app/services/ai-service'
import { CompanyService } from '@/modules/whats-app/services/company-service'
import { ConversationService } from '@/modules/whats-app/services/conversation-service'
import { UserService } from '@/modules/whats-app/services/user-service'
import { WhatsAppMediaService } from '@/modules/whats-app/services/whatsapp-media-service'
import { appendToLogFile, findProjectRoot } from '@/utils/files'
import { OpenAI, toFile } from 'openai'
import pdfParse from 'pdf-parse'
import { systemInstructions } from '../constants'
import { tokenBudgetManager } from '../token-budget-manager'
import {
	FunctionCallOutputSchema,
	FunctionCallSchema,
	OutputItem,
	ResponseInput,
	Tool,
} from '../types'
import { functionRegistry } from './functions/registry'
import { saveUserDataTool } from './functions/save-user-data'
import { type TagClassification, classifyTags } from './tag-router'

function isFunctionCall(i: OutputItem): boolean {
	return FunctionCallSchema.safeParse(i).success
}

function stitchRecentMessagesForBudget(
	conversation: Conversation,
	tailCount = 30
) {
	// junta as últimas N mensagens do usuário e do assistente em um texto
	const msgs = conversation.messages.slice(-tailCount)
	return msgs
		.map(m => `${m.senderType === SenderType.AI ? 'AI' : 'User'}: ${m.content}`)
		.join('\n')
}

const APPROX_TOKEN_RATIO = 4
const approxTokens = (t: string) =>
	Math.ceil((t ?? '').length / APPROX_TOKEN_RATIO)

function countFileSearchChunks(res: any): number {
	try {
		return (
			res.output?.flatMap((o: any) =>
				(o.content ?? []).filter((c: any) => c.type === 'file_search_result')
			).length ?? 0
		)
	} catch {
		return 0
	}
}

function getFileSearchResults(res: any): any[] {
	try {
		return (
			res.output?.flatMap((o: any) =>
				(o.content ?? []).filter((c: any) => c.type === 'file_search_result')
			) ?? []
		)
	} catch {
		return []
	}
}

export class AIResponseService extends AIService {
	private client: OpenAI
	private tools: Tool[] = []

	constructor(
		private conversationService: ConversationService,
		private userService: UserService,
		private companyService: CompanyService,
		private whatsAppMediaService: WhatsAppMediaService
	) {
		super()

		this.client = openAIClient

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
			const stringifyedClient = JSON.stringify(
				{
					phone: client.phone,
					name: client.name,
					profession: client.profession ?? 'não informado',
					email: client.email ?? 'não informado',
				},
				null,
				2
			)
			instructions +=
				'\nVocê está conversando com um cliente. De acordo com a base de dados essas são as informações que temos:\n'
			instructions += `${stringifyedClient}\n`
			instructions +=
				'Se tiver alguma informação nula ou faltando, solicite ao cliente.'
		} else if (conversation.userType === UserType.EMPLOYEE) {
			const employee = await this.userService.getEmployee(
				conversation.companyId,
				conversation.userId,
				{ notNull: true }
			)
			instructions +=
				'\nVocê está conversando com um funcionário. De acordo com a base de dados essas são as informações que temos:\n'
			instructions += `${JSON.stringify({ phone: employee.phone, name: employee.name }, null, 2)}\n`
		}

		return instructions
	}

	private async answer(
		conversation: Conversation,
		input: ResponseInput,
		lastResponseId: Nullable<string> = null,
		opts?: {
			toolsOverride?: Tool[]
			maxOutputTokensOverride?: number
			fileSearchFilters?: {
				attributes: Record<string, unknown>
			}
		}
	) {
		const company = await this.companyService.getCompany(
			conversation.companyId,
			{ notNull: true }
		)
		const instructions = await this.buildInstructions(conversation)

		// Se veio override, usa; senão monta padrão com file_search
		const tools: Tool[] =
			opts?.toolsOverride ??
			(() => {
				const base = [...this.tools]
				if (company.storageId) {
					const fileSearch: any = {
						type: 'file_search',
						vector_store_ids: [company.storageId],
						max_num_results: 6,
					}
					if (opts?.fileSearchFilters) {
						fileSearch.filters = opts.fileSearchFilters
					}
					base.push(fileSearch)
				}
				return base
			})()

		// Limite de saída dinâmico
		const { outputLimit } = tokenBudgetManager.getLimits(conversation.id)
		const max_output_tokens = opts?.maxOutputTokensOverride ?? outputLimit

		logger.debug('[AIResponseService.answer] Configuração da requisição:', {
			input,
			instructions,
			tools,
			max_output_tokens,
		})

		const res = await this.client.responses.create({
			model: 'gpt-4o-mini',
			store: true,
			input,
			previous_response_id: lastResponseId ?? undefined,
			instructions,
			tools,
			max_output_tokens,
		})

		// ←—— Atualiza o orçamento com a medição real
		try {
			// @ts-ignore: depende do typing da sua versão; proteja defensivamente
			const usage = res.usage ?? res?.response?.usage ?? {}
			tokenBudgetManager.update(conversation.id, usage)
			logger.debug('[AIResponseService.answer] Uso de tokens:', usage)
		} catch {
			/* ignora telemetria se faltar campo */
		}

		const fileResults = getFileSearchResults(res)
		if (fileResults.length) {
			logger.debug(
				'[AIResponseService.answer] Resultados da busca de arquivos:',
				fileResults
			)
		} else {
			logger.debug('[AIResponseService.answer] Nenhum arquivo encontrado')
		}

		return res
	}

	private async generateResponse(
		conversation: Conversation,
		input: ResponseInput,
		lastResponseId: Nullable<string> = null,
		tagInfo?: TagClassification
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

		let filters: any
		let searchWithoutFilters = false
		if (!tagInfo || tagInfo.tags.length === 0 || tagInfo.confidence < 0.6) {
			searchWithoutFilters = true
		} else {
			filters = {
				attributes: Object.fromEntries(
					tagInfo.tags.map(t => [`tag_${t}`, true])
				),
			}
		}

		logger.debug(
			'[AIResponseService] Filtros para busca de arquivos:',
			filters ?? 'nenhum'
		)

		let response = await this.answer(conversation, inputs, lastResponseId, {
			fileSearchFilters: filters,
		})

		if (searchWithoutFilters) {
			logger.debug('[AIResponseService] Busca de arquivos sem filtros de tags')
		} else if (filters) {
			const chunks = countFileSearchChunks(response)
			if (chunks < 2) {
				logger.debug(
					'[AIResponseService] Poucos resultados com filtro, refazendo sem filtros'
				)
				response = await this.answer(conversation, inputs, lastResponseId)
			} else {
				logger.debug(
					`[AIResponseService] Busca filtrada por tags: ${tagInfo?.tags.join(', ')}`
				)
			}
		}
		let totalTokens = response.usage?.total_tokens ?? 0
		const projectRoot = findProjectRoot(__dirname)
		const savePath = path.join(projectRoot, 'openai-responses.json')

		appendToLogFile(savePath, response)

		const outputs = response.output ?? []
		const calls = outputs.filter(isFunctionCall)

		if (calls.length) {
			const results: OpenAI.Responses.ResponseInput = []

			for (const raw of calls) {
				const parsed = FunctionCallSchema.parse(raw)
				const { name, arguments: strArgs, call_id } = parsed

				let args: unknown
				try {
					args = JSON.parse(strArgs || '{}')
				} catch {
					args = {}
				}

				const entry = functionRegistry[name]
				let output: string

				if (entry) {
					const checked = entry.schema.parse(args)
					const res = await entry.fn(checked)
					output = typeof res === 'string' ? res : JSON.stringify(res)
				} else {
					output = `Função '${name}' não registrada`
				}

				const outputItem = FunctionCallOutputSchema.parse({
					type: 'function_call_output',
					call_id,
					output,
				})

				results.push(outputItem)
			}

			const followup = await this.answer(conversation, results, response.id)
			totalTokens += followup.usage?.total_tokens ?? 0

			appendToLogFile(savePath, followup)
			return {
				message: followup.output_text,
				responseId: followup.id,
				totalTokens,
			}
		}

		return {
			message: response.output_text,
			responseId: response.id,
			totalTokens,
		}
	}

	async makeResponse(
		conversation: Conversation,
		message: Message,
		wppIncomingContent: WppIncomingContent
	) {
		try {
			logger.debug(
				'[AIResponseService] Generating response for message: ',
				wppIncomingContent
			)
			let input: string

			switch (wppIncomingContent.kind) {
				case 'text': {
					input = wppIncomingContent.text
					break
				}
				case 'document': {
					if (wppIncomingContent.media.mime !== 'application/pdf') {
						throw new UnsupportedFileTypeError(
							'Não suportamos esse tipo de arquivo, envie apenas PDF'
						)
					}
					const docFile = await this.whatsAppMediaService.download(
						wppIncomingContent.media.id
					)
					const docParse = await pdfParse(docFile.buffer)
					input = `Conteúdo do arquivo enviado:\n${docParse.text}`
					break
				}
				case 'audio': {
					const audioFile = await this.whatsAppMediaService.download(
						wppIncomingContent.media.id
					)
					const file = await toFile(audioFile.buffer, 'audio.ogg', {
						type: wppIncomingContent.media.mime || 'audio/ogg',
					})
					const audioContent = await this.client.audio.transcriptions.create({
						model: 'gpt-4o-mini-transcribe',
						file,
					})
					input = audioContent.text
					break
				}
				default: {
					logger.error(
						`This kind(${wppIncomingContent.kind}) of message is not supported yet.`
					)
					throw new UnsupportedMessageTypeError(
						`This kind(${wppIncomingContent.kind}) of message is not supported yet.`
					)
				}
			}

			logger.debug('[AIResponseService] Entrada processada para IA:', input)

			const messages = await this.conversationService.getConversationMessages(
				conversation.companyId,
				conversation.id
			)
			const lastGeneratedByAIResponse = messages.find(
				message =>
					!!message.aiResponseId && message.senderType === SenderType.AI
			)
			let lastResponseId: Nullable<string> = lastGeneratedByAIResponse
				? lastGeneratedByAIResponse.aiResponseId
				: null
			const { inputLimit, outputLimit } = tokenBudgetManager.getLimits(
				conversation.id
			)

			// estimativa rápida de tokens do contexto + pergunta
			const recentContext = stitchRecentMessagesForBudget(conversation, 30)
			const budget = approxTokens(recentContext) + approxTokens(input)
			if (budget > inputLimit) {
				// desliga tools no resumo, resposta curtinha
				const summaryTurn = await this.answer(
					conversation,
					[
						{
							role: 'user',
							content: 'Resuma objetivamente a conversa até aqui...',
						},
					],
					null,
					{
						toolsOverride: [],
						maxOutputTokensOverride: Math.min(400, outputLimit),
					}
				)

				input = `Resumo da conversa até agora:\n${summaryTurn.output_text}\n\nAgora responda ao usuário:\n${input}`
				lastResponseId = null // reset leve
			}
			const tagInfo = await classifyTags(input)
			logger.debug('[AIResponseService] Tags identificadas:', tagInfo)

			if (tagInfo.confidence >= 0.6 && tagInfo.tags.length) {
				conversation.intentTags = tagInfo.tags
			}

			const result = await this.generateResponse(
				conversation,
				input,
				lastResponseId,
				tagInfo
			)
			logger.debug('[AIResponseService] Resultado da geração:', result)
			const newMessage = Message.create({
				conversationId: conversation.id,
				senderType: SenderType.AI,
				content: result.message,
				aiResponseId: result.responseId,
			})

			conversation.messages.push(newMessage)
			conversation.tokensCount += result.totalTokens
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
