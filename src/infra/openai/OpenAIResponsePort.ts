import type { MessageQueue, ToolIntent } from '@/infra/jobs/MessageQueue'
import { logger as _logger } from '@/infra/logging/logger'
import { inc } from '@/infra/logging/metrics'
import {
	AIMakeResponseInput,
	AIMakeResponseResult,
	AIResponsePort,
} from '@/modules/main/ports/AIResponsePort'
import type { AIChatSessionRepository } from '@/repository/AIChatSessionRepository'
import { CustomerRepository } from '@/repository/CustomerRepository'
import type { DepartmentRepository } from '@/repository/DepartmentRepository'
import type { EmployeeRepository } from '@/repository/EmployeeRepository'
import type { StateStore } from '@/repository/StateStore'
import { TenantRepository } from '@/repository/TenantRepository'
import OpenAI from 'openai'
import { trace, SpanStatusCode } from '@opentelemetry/api'
import type { ConversationLogger as ConversationLoggerBase } from './ConversationLogger'
import { OpenAIClientRegistry } from './OpenAIClientRegistry'
import { tokenBudgetManager } from './token-budget'
import { FunctionToolRegistry } from './tools/FunctionTools'

const APPROX_TOKEN_RATIO = 4
const approxTokens = (t: string) =>
	Math.ceil((t ?? '').length / APPROX_TOKEN_RATIO)

export class OpenAIResponsePort implements AIResponsePort {
	constructor(
		private readonly customerRepository: CustomerRepository,
		private readonly departmentRepository: DepartmentRepository,
		private readonly employeeRepository: EmployeeRepository,
		private readonly clientRegistry: OpenAIClientRegistry,
		private readonly tenantRepository: TenantRepository,
		private readonly stateStore: StateStore,
		private readonly conversationLogger: ConversationLoggerBase,
		private readonly functionToolRegistry: FunctionToolRegistry,
		private readonly messageQueue: MessageQueue,
		private readonly aiChatRepository: AIChatSessionRepository
	) {}

	async makeResponse(
		input: AIMakeResponseInput
	): Promise<AIMakeResponseResult> {
		const { tenantId, userPhone, text, lastResponseId, role, conversationId } =
			input
		const tracer = trace.getTracer('wpp-api')

		const logger = _logger.child({
			component: 'OpenAIResponsePort',
			tenantId,
			userPhone,
			conversationId,
			role,
		})

		// Resolve OpenAI client and tenant settings
		const [openai, settings, snapshot] = await Promise.all([
			this.clientRegistry.getClientForTenant(tenantId),
			this.tenantRepository.getSettings(tenantId),
			this.stateStore.load(tenantId, userPhone).catch(() => null),
		])

		const agentInstruction = (settings.agentInstruction ?? '').trim()
		const persona =
			role === 'EMPLOYEE'
				? 'Você está auxiliando um colaborador interno. Seja objetivo, forneça passos claros e evite redundância.'
				: 'Você está atendendo um cliente final. Seja cordial, direto e evite jargões técnicos.'

		// Optionally include department/employee context when available
		let employeeHint: string | null = null
		try {
			if (role === 'EMPLOYEE') {
				const emp = await this.employeeRepository.findByPhone(
					tenantId,
					userPhone
				)
				if (emp) {
					employeeHint = `Colaborador: ${emp.name}${emp.departmentName ? ` (Departamento: ${emp.departmentName})` : ''}.`
				}
			}
		} catch {}

		// Resolve dados do interlocutor (cliente/funcionário) para o prompt
		let userIdentityBlock: string | null = null
		try {
			if (role === 'CLIENT') {
				const rows = await this.customerRepository.findByPhones(tenantId, [
					userPhone,
				])
				const c = rows[0]
				const name = c?.name ?? null
				const email = c?.email ?? null
				const profession = c?.profession ?? null
				userIdentityBlock = [
					'Identidade do interlocutor:',
					'- tipo: CLIENTE',
					`- phone: ${userPhone}`,
					`- name: ${name === null || name === undefined ? 'null' : name}`,
					`- email: ${email === null || email === undefined ? 'null' : email}`,
					`- profession: ${
						profession === null || profession === undefined
							? 'null'
							: profession
					}`,
				].join('\n')
			} else {
				const emp = await this.employeeRepository.findByPhone(
					tenantId,
					userPhone
				)
				userIdentityBlock = [
					'Identidade do interlocutor:',
					'- tipo: FUNCIONARIO',
					`- phone: ${userPhone}`,
					`- name: ${emp?.name ?? 'null'}`,
					`- departmentName: ${emp?.departmentName ?? 'null'}`,
				].join('\n')
			}
		} catch {}

		// Token budgeting (simple EMA-based caps by conversation)
		const budgetKey = `${tenantId}:${conversationId}`
		const { inputLimit, outputLimit } = tokenBudgetManager.getLimits(budgetKey)
		const userText = String(text ?? '')
		// Hard truncate overly long inputs to keep within approximate budget
		const approxUserTokens = approxTokens(userText)
		let trimmedUserText = userText
		if (approxUserTokens > inputLimit) {
			const ratio = inputLimit / Math.max(1, approxUserTokens)
			trimmedUserText = userText.slice(
				0,
				Math.max(200, Math.floor(userText.length * ratio))
			)
		}

		// Rolling summary (persisted per conversation)
		type SnapshotData = {
			lastResponseByConversation?: Record<string, string>
			summaryByConversation?: Record<string, string>
		}

		const isRecord = (v: unknown): v is Record<string, unknown> =>
			typeof v === 'object' && v !== null

		const coerceSnapshotData = (v: unknown): SnapshotData => {
			if (!isRecord(v)) return {}
			const out: SnapshotData = {}
			const logger = v['lastResponseByConversation']
			if (isRecord(logger)) {
				const acc: Record<string, string> = {}
				for (const [k, val] of Object.entries(logger)) {
					if (typeof k === 'string' && typeof val === 'string') acc[k] = val
				}
				out.lastResponseByConversation = acc
			}
			const s = v['summaryByConversation']
			if (isRecord(s)) {
				const acc: Record<string, string> = {}
				for (const [k, val] of Object.entries(s)) {
					if (typeof k === 'string' && typeof val === 'string') acc[k] = val
				}
				out.summaryByConversation = acc
			}
			return out
		}

		const data = coerceSnapshotData(snapshot?.data)
		const rollingSummary =
			(conversationId && data.summaryByConversation?.[conversationId]) || null

		// Sinalização de primeiro turno da IA baseada na contagem de mensagens já enviadas
		const aiMessageCount = await this.aiChatRepository.getAIMessageCount(
			tenantId,
			userPhone
		)
		const isFirstAiTurn = aiMessageCount === 0

		const system = [
			'Você é um assistente virtual experiente para WhatsApp.',
			'Objetivo: entender a solicitação e responder de forma curta e útil.',
			'Idioma: responda sempre em português do Brasil.',
			persona,
			employeeHint ?? undefined,
			userIdentityBlock ?? undefined,
			agentInstruction
				? `Instruções da empresa: ${agentInstruction}`
				: undefined,
			rollingSummary
				? `Contexto resumido da conversa (use como referência):\n${rollingSummary}`
				: undefined,
			'Uso de ferramentas: chame uma ferramenta apenas quando TODOS os parâmetros obrigatórios estiverem claros e presentes.\n' +
				'- Se faltar informação, NÃO chame a ferramenta; faça uma pergunta objetiva para coletar o dado que falta.\n' +
				'- Na função de transferir o cliente pra um outro departamento, a escolha do departamento deve vir explicitamente do usuário, não faça suposições, pergunte diretamente a ele.\n' +
				"- Exemplo: para 'transferir' é obrigatório o campo department. Se o usuário pedir 'pode me transferir?', pergunte 'Claro! Para qual departamento?'.\n" +
				'- Ao coletar um valor com poucas opções possíveis, apresente uma lista curta e clara.',
			// Regras de menção à base de conhecimento (file_search)
			'Ao usar file_search, entenda que são DOCUMENTOS INTERNOS da empresa (base de conhecimento), não arquivos enviados pelo cliente.',
			'Nunca diga que o cliente enviou arquivos a menos que a conversa atual contenha um anexo/mídia recebido explicitamente.',
			"Quando referir-se a conteúdos encontrados via file_search, use termos como 'nossa base de conhecimento' ou 'documentação interna', evitando 'seus arquivos'.",
			'Quando o assunto começar a fugir muito do escopo de os arquivos internos e a base deconhecimento fornece, não invente respostas e recomende ao cliente que ele finalize e converse com algum dos setores da empresa.',
			// Apresentação inicial e coleta de dados (CLIENTE)
			role === 'CLIENT' && isFirstAiTurn
				? [
						'PRIMEIRO TURNO COM O CLIENTE: cumprimente de forma breve e cordial (use o nome quando disponível) e apresente-se como "Evo, a inteligência artificial da Evolight" em 1–2 frases, explicando como pode ajudar (energia, eficiência, solar, etc.).',
						'Após a apresentação, verifique se há dados do cliente faltantes (ex.: email, profession) e pergunte educadamente por eles em seguida. Quando o cliente informar, chame a ferramenta atualizar_dados_cliente com os campos fornecidos (mantenha null para ausentes).',
					].join('\n')
				: undefined,
			// Orientação para conversas em andamento (CLIENTE)
			role === 'CLIENT' && !isFirstAiTurn
				? 'CONVERSA EM ANDAMENTO: Esta não é uma primeira interação. NÃO se reapresente, NÃO dê boas-vindas como se fosse o primeiro contato, e NÃO cumprimente como se acabasse de conhecer o cliente. Continue a conversa de forma natural conforme o contexto.'
				: undefined,
			// Orientações sobre atualização de dados do cliente
			role === 'CLIENT'
				? [
						'Quando dados do cliente estiverem null/indefinidos (ex.: name, email, profession), solicite-os educadamente e, após o cliente responder, chame a ferramenta atualizar_dados_cliente com os campos fornecidos.',
						'Não invente valores. Se o cliente não souber, mantenha como null.',
					].join('\n')
				: 'Não colete ou atualize dados cadastrais quando o interlocutor for FUNCIONÁRIO; ignore a ferramenta atualizar_dados_cliente.',
			'Boas práticas: não invente fatos; quando faltar contexto, solicite esclarecimentos. Liste passos em pontos curtos quando útil.',
		]
			.filter(Boolean)
			.join('\n')

		const user = trimmedUserText

		// (limpo) logs específicos de depuração de ENERGY_BILL removidos

		// Enable file_search with tenant's vector store (best-effort)
		let vectorStoreId: string | null = null
		await tracer.startActiveSpan('vectorstore.ensure', async s => {
			try {
				const vsm =
					await this.clientRegistry.getVectorStoreManagerForTenant(tenantId)
				vectorStoreId = await vsm.ensureVectorStoreForTenant(tenantId)
				s.setAttribute('vector.store_id', String(vectorStoreId))
			} catch (e: any) {
				vectorStoreId = null
				s.recordException(e)
				s.setStatus({
					code: SpanStatusCode.ERROR,
					message: 'vectorstore.ensure.failed',
				})
			} finally {
				s.end()
			}
		})

		// Compose response request (inline to help TS pick non-stream overload)
		const metadata: Record<string, string> = {
			conversationId,
			role,
			tenantId,
		}
		const { tools: fnTools, resolved: resolvedSpecs } =
			await this.functionToolRegistry.buildForContext({
				tenantId,
				userPhone,
				conversationId,
				role,
			})
		logger.info('tools_build_for_context', { fnToolCount: fnTools.length })
		const tools: OpenAI.Responses.Tool[] = [...fnTools]

		if (lastResponseId) metadata.lastResponseId = lastResponseId
		if (vectorStoreId) {
			tools.push({
				type: 'file_search',
				vector_store_ids: [vectorStoreId],
			})
			logger.info('file_search_attached', { vectorStoreId })
		}

		// Persist log: user message for this conversation
		await this.conversationLogger.init({
			tenantId,
			conversationId,
			userPhone,
			role,
		})
		await this.conversationLogger.append(
			{ tenantId, conversationId, userPhone, role },
			{ at: new Date().toISOString(), kind: 'user', text: user }
		)

		logger.info('openai_responses_create', {
			model: 'gpt-4o-mini',
			inputLen: user.length,
			toolsCount: tools.length,
			previous_response_id: lastResponseId ?? null,
			include: 'file_search_call.results',
			outputLimit,
		})
		inc('openai_request_total')
		let res: any
		await tracer.startActiveSpan('openai.responses.create', async s => {
			s.setAttribute('model', 'gpt-4o-mini')
			try {
				res = await openai.responses.create({
					model: 'gpt-4o-mini',
					instructions: system,
					input: [{ role: 'user', content: user }],
					tools,
					tool_choice: 'auto',
					max_output_tokens: outputLimit,
					metadata,
					previous_response_id: lastResponseId,
					include: ['file_search_call.results'],
				})
				inc('openai_success_total')
			} catch (err: any) {
				inc('openai_error_total')
				if (err?.status === 429 || err?.code === 'insufficient_quota')
					inc('openai_429_total')
				logger.error('openai_create_error', { err })
				s.recordException(err)
				s.setStatus({
					code: SpanStatusCode.ERROR,
					message: String(err?.message || err),
				})
				throw err
			} finally {
				s.end()
			}
		})
		// (limpo) não imprimir resposta completa no console
		const reply = String(res.output_text ?? '').trim()

		// Track usage to adapt future budgets
		const extractUsage = (
			resp: unknown
		): { input_tokens?: number; output_tokens?: number } => {
			if (!isRecord(resp)) return {}
			const u = resp['usage']
			if (!isRecord(u)) return {}
			const input = u['input_tokens']
			const output = u['output_tokens']
			return {
				input_tokens: typeof input === 'number' ? input : undefined,
				output_tokens: typeof output === 'number' ? output : undefined,
			}
		}
		const usage = extractUsage(res)
		// Coleta e loga finish reasons (p.ex.: 'stop', 'length') para depuração
		const findFinishReasons = (root: unknown): string[] => {
			const reasons = new Set<string>()
			const seen = new Set<unknown>()
			const stack: unknown[] = [root]
			const keyRegex = /finish_?reason/i
			while (stack.length) {
				const cur = stack.pop()
				if (!cur || seen.has(cur)) continue
				seen.add(cur)
				if (Array.isArray(cur)) {
					for (const it of cur) stack.push(it)
					continue
				}
				if (typeof cur !== 'object' || cur === null) continue
				for (const [k, v] of Object.entries(cur)) {
					if (keyRegex.test(k) && typeof v === 'string') reasons.add(v)
					if (typeof v === 'object' && v !== null) stack.push(v)
				}
			}
			return Array.from(reasons)
		}
		try {
			const reasons = findFinishReasons(res)
			logger.info('openai_finish', {
				id: res?.id,
				max_output_tokens: outputLimit,
				reasons,
				usage,
			})
		} catch {}
		try {
			tokenBudgetManager.update(budgetKey, usage)
		} catch {}

		// Extract file_search results (best-effort)
		const findFileSearchResults = (
			root: unknown
		): Array<{
			fileId?: string
			fileName?: string
			score?: number
			snippet?: string
		}> => {
			const hits: Array<{
				fileId?: string
				fileName?: string
				score?: number
				snippet?: string
			}> = []
			const seen = new Set<unknown>()
			const stack: unknown[] = [root]
			const pushHit = (o: Record<string, unknown>) => {
				const fid = o['file_id']
				const file = o['file']
				const score = o['score']
				const text = o['text'] ?? o['content'] ?? o['snippet']
				let fileId: string | undefined
				let fileName: string | undefined
				if (typeof fid === 'string') fileId = fid
				if (isRecord(file)) {
					const fId = file['id']
					const fName = file['filename'] ?? file['name']
					if (typeof fId === 'string') fileId = fileId ?? fId
					if (typeof fName === 'string') fileName = fName
				}
				hits.push({
					fileId,
					fileName,
					score: typeof score === 'number' ? score : undefined,
					snippet: typeof text === 'string' ? text.slice(0, 500) : undefined,
				})
			}
			while (stack.length) {
				const cur = stack.pop()
				if (!cur || seen.has(cur)) continue
				seen.add(cur)
				if (Array.isArray(cur)) {
					for (const x of cur) stack.push(x)
					continue
				}
				if (!isRecord(cur)) continue
				// common container: results: []
				for (const [k, v] of Object.entries(cur)) {
					if (Array.isArray(v) && /results?/i.test(k)) {
						for (const it of v) if (isRecord(it)) pushHit(it)
					} else if (isRecord(v) || Array.isArray(v)) {
						stack.push(v)
					}
				}
			}
			return hits
		}
		const fileSearchHits = vectorStoreId ? findFileSearchResults(res) : []

		// Function tool calls: dispatch and follow-up response with outputs
		const extractFunctionCalls = (
			root: unknown
		): Array<{
			id?: string
			call_id?: string
			name: string
			arguments: string
		}> => {
			const calls: Array<{
				id?: string
				call_id?: string
				name: string
				arguments: string
			}> = []
			if (!isRecord(root)) return calls
			const out = root['output']
			if (!Array.isArray(out)) return calls
			for (const item of out) {
				if (!isRecord(item)) continue
				if (item['type'] === 'function_call') {
					const name = item['name']
					const args = item['arguments']
					const id = item['id']
					const call_id = item['call_id']
					if (typeof name === 'string' && typeof args === 'string') {
						calls.push({
							name,
							arguments: args,
							id: typeof id === 'string' ? id : undefined,
							call_id: typeof call_id === 'string' ? call_id : undefined,
						})
					}
				}
			}
			return calls
		}
		const funcCalls = extractFunctionCalls(res)
		logger.info('function_calls_detected', { count: funcCalls.length })
		let finalReply = reply
		let responseIdForThread: string | undefined = res.id
		let usedFunctionTools: string[] = []
		if (funcCalls.length > 0) {
			const ctx = { tenantId, userPhone, conversationId, role }
			const parsedCalls = funcCalls.map(c => {
				let parsedArgs: unknown
				try {
					parsedArgs = JSON.parse(c.arguments)
				} catch {
					parsedArgs = c.arguments
				}
				return {
					id: c.id ?? c.call_id,
					name: c.name,
					args: parsedArgs,
					call_id: c.call_id,
				}
			})
			// (limpo) evitar log detalhado dos argumentos de tools
			const dispatchInputs = parsedCalls.map(pc => ({
				id: pc.id,
				name: pc.name,
				args: pc.args,
			}))
			// (limpo) início do dispatch sem log detalhado
			const outputs = await tracer.startActiveSpan(
				'tools.dispatch',
				async s => {
					try {
						const out = await this.functionToolRegistry.dispatchAll(
							dispatchInputs,
							ctx,
							resolvedSpecs
						)
						s.setAttribute('tools.count', out.length)
						return out
					} catch (e: any) {
						s.recordException(e)
						s.setStatus({
							code: SpanStatusCode.ERROR,
							message: 'tools.dispatch.failed',
						})
						throw e
					} finally {
						s.end()
					}
				}
			)
			// (limpo) fim do dispatch sem log detalhado
			// Registrar eventos de tools no ConversationLogger (sanitizados)
			const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n) : s)
			for (const pc of parsedCalls) {
				const out = outputs.find(o => o.id && pc.id && o.id === pc.id)?.output
				let argStr = ''
				try {
					argStr =
						typeof pc.args === 'string' ? pc.args : JSON.stringify(pc.args)
				} catch {
					argStr = String(pc.args)
				}
				let outStr = ''
				let errStr: string | undefined
				try {
					outStr = typeof out === 'string' ? out : JSON.stringify(out)
				} catch {
					outStr = String(out)
				}
				if (out && typeof out === 'object' && (out as any).error) {
					errStr = String((out as any).error)
				}
				await this.conversationLogger.append(
					{ tenantId, conversationId, userPhone, role },
					{
						at: new Date().toISOString(),
						kind: 'event',
						text: 'tool',
						tool: {
							name: pc.name,
							args: trunc(argStr, 2000),
							output: outStr ? trunc(outStr, 1000) : undefined,
							error: errStr,
						},
					}
				)
			}
			usedFunctionTools = parsedCalls.map(pc => pc.name)
			const toolOutputs = outputs
				.map(o => {
					const co = parsedCalls.find(pc => pc.id && o.id && pc.id === o.id)
					const callId = co?.call_id || co?.id
					if (!callId) return null
					let outStr = ''
					try {
						outStr = JSON.stringify(o.output)
					} catch {
						outStr = String(o.output)
					}
					return {
						type: 'function_call_output' as const,
						call_id: callId,
						output: outStr,
					}
				})
				.filter(Boolean) as Array<{
				type: 'function_call_output'
				call_id: string
				output: string
			}>

			if (toolOutputs.length > 0) {
				logger.info('openai_followup_submit', {
					count: toolOutputs.length,
					items: toolOutputs.map(o => ({
						call_id: o.call_id,
						size: o.output.length,
					})),
				})
				let res2: any
				await tracer.startActiveSpan('openai.responses.followup', async s => {
					s.setAttribute('model', 'gpt-4o-mini')
					try {
						res2 = await openai.responses.create({
							model: 'gpt-4o-mini',
							instructions: system,
							input: toolOutputs,
							tools,
							max_output_tokens: outputLimit,
							metadata,
							previous_response_id: res.id,
							include: ['file_search_call.results'],
						})
						inc('openai_success_total')
					} catch (err: any) {
						inc('openai_error_total')
						if (err?.status === 429 || err?.code === 'insufficient_quota')
							inc('openai_429_total')
						logger.error('openai_followup_error', { err })
						s.recordException(err)
						s.setStatus({
							code: SpanStatusCode.ERROR,
							message: String(err?.message || err),
						})
						throw err
					} finally {
						s.end()
					}
				})
				logger.info('openai_followup_ok', { id: res2.id })
				finalReply = String(res2.output_text ?? '').trim()
				responseIdForThread = res2.id
				const usage2 = extractUsage(res2)
				try {
					const reasons2 = findFinishReasons(res2)
					logger.info('openai_finish', {
						id: res2?.id,
						stage: 'followup',
						max_output_tokens: outputLimit,
						reasons: reasons2,
						usage: usage2,
					})
				} catch {}
				try {
					tokenBudgetManager.update(budgetKey, usage2)
				} catch {}

				// Orquestra intents retornadas pelas tools
				try {
					const intents: ToolIntent[] = []
					for (const o of outputs) {
						const out = o.output as any
						if (out && typeof out === 'object') {
							if (
								out.intent === 'ENTER_QUEUE' &&
								typeof out.department === 'string'
							) {
								intents.push({
									type: 'ENTER_QUEUE',
									department: out.department,
								})
							}
							if (out.intent === 'END_AI_CHAT') {
								intents.push({ type: 'END_AI_CHAT', reason: out.reason })
							}
						}
					}
					if (intents.length) {
						await this.messageQueue.enqueue({
							kind: 'intent',
							tenantId,
							userPhone,
							conversationId,
							intents,
						})
						logger.info('intent_queued', { intentsCount: intents.length })
					}
				} catch (err) {
					logger.error('intent_enqueue_failed', { err })
				}
			}
		}

		// Decide if we should summarize and reset thread
		const inTok =
			usage.input_tokens ?? approxTokens(system) + approxTokens(user)
		const shouldSummarize = inTok >= Math.floor(inputLimit * 0.9)

		if (shouldSummarize) {
			// Build an incremental summary combining previous summary + latest turn
			const summarySystem = [
				'Você é um assistente que mantém um RESUMO CURTO e informativo da conversa.',
				'Objetivo: condensar o contexto relevante para próximas interações em até ~1800 caracteres.',
				'Regras: preserve fatos, decisões, números, prazos e intenções; remova redundâncias e saudações; mantenha em português; não inclua dados sensíveis desnecessários.',
			].join('\n')
			const summaryUser = [
				rollingSummary ? `Resumo atual (se houver):\n${rollingSummary}` : '',
				'Mensagem do usuário mais recente:',
				trimmedUserText,
				'Resposta da IA mais recente:',
				reply,
			]
				.filter(Boolean)
				.join('\n\n')
			const sumRes = await openai.responses.create({
				model: 'gpt-4o-mini',
				input: [
					{ role: 'system', content: summarySystem },
					{ role: 'user', content: summaryUser },
				],
				max_output_tokens: 600,
			})
			const newSummary = String(sumRes.output_text ?? '').trim()
			// Log summarization event
			await this.conversationLogger.append(
				{ tenantId, conversationId, userPhone, role },
				{
					at: new Date().toISOString(),
					kind: 'event',
					text: `thread_summarized\n${newSummary}`,
				}
			)

			// Persist new summary and reset lastResponseId in snapshot
			if (snapshot && conversationId) {
				const newData: SnapshotData = {
					...(data || {}),
					lastResponseByConversation: {
						...(data?.lastResponseByConversation || {}),
						[conversationId]: '',
					},
					summaryByConversation: {
						...(data?.summaryByConversation || {}),
						[conversationId]: newSummary,
					},
				}
				try {
					await this.stateStore.save(
						tenantId,
						userPhone,
						snapshot.state,
						newData,
						snapshot.aiSessionId ?? null
					)
				} catch {}
			}

			// Log AI reply (with context used and tools)
			await this.conversationLogger.append(
				{ tenantId, conversationId, userPhone, role },
				{
					at: new Date().toISOString(),
					kind: 'ai',
					text: finalReply || '... ',
					usage,
					model: 'gpt-4o-mini',
					system,
					tools: [
						...(vectorStoreId ? ['file_search'] : []),
						...usedFunctionTools,
					],
					vectorStoreId,
					fileSearch: fileSearchHits.length
						? { results: fileSearchHits }
						: undefined,
				}
			)
			return {
				text: finalReply || '... ',
				responseId: undefined,
				usage,
				summarized: true,
			}
		}

		// Log AI reply (normal path)
		await this.conversationLogger.append(
			{ tenantId, conversationId, userPhone, role },
			{
				at: new Date().toISOString(),
				kind: 'ai',
				text: finalReply || '... ',
				responseId: responseIdForThread,
				usage,
				model: 'gpt-4o-mini',
				system,
				tools: [
					...(vectorStoreId ? ['file_search'] : []),
					...usedFunctionTools,
				],
				vectorStoreId,
				fileSearch: fileSearchHits.length
					? { results: fileSearchHits }
					: undefined,
			}
		)
		return {
			text: finalReply || '... ',
			responseId: responseIdForThread,
			usage,
			summarized: false,
		}
	}
}
