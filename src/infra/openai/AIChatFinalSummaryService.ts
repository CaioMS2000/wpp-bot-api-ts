import { logger } from '@/infra/logging/logger'
import type { PrismaClient } from '@prisma/client'
import type OpenAI from 'openai'
import { OpenAIClientRegistry } from './OpenAIClientRegistry'

export class AIChatFinalSummaryService {
	constructor(
		private readonly prisma: PrismaClient,
		private readonly clientRegistry: OpenAIClientRegistry
	) {}

	async summarizeLatestEndedSession(
		tenantId: string,
		phone: string
	): Promise<string | null> {
		const session = await this.prisma.aIChatSession.findFirst({
			where: { tenantId, phone, endedAt: { not: null }, finalSummary: null },
			orderBy: { endedAt: 'desc' },
			select: { id: true },
		})
		if (!session) return null

		const messages = await this.prisma.aIMessage.findMany({
			where: { aiChatSessionId: session.id },
			orderBy: { createdAt: 'asc' },
			select: { sender: true, text: true },
		})

		if (!messages.length) {
			await this.prisma.aIChatSession.update({
				where: { id: session.id },
				data: { finalSummary: '' },
			})
			return ''
		}

		const header = [
			'Resuma de forma concisa e objetiva a conversa a seguir entre IA e cliente.',
			'Foque em pedidos, dúvidas, dados fornecidos, decisões e próximos passos.',
			'NÃO inclua dados sensíveis. Não faça perguntas. Máx. ~12 linhas.',
		].join('\n')

		const bodyLines = messages.map(
			m => `[${m.sender === 'AI' ? 'IA' : 'Cliente'}] ${m.text}`
		)
		const rawBody = bodyLines.join('\n')

		// limite simples por caracteres para evitar entradas excessivas (aprox 3500 tokens)
		const MAX_CHARS = 14000
		const body =
			rawBody.length > MAX_CHARS ? rawBody.slice(-MAX_CHARS) : rawBody

		let summary = ''
		try {
			const client: OpenAI =
				await this.clientRegistry.getClientForTenant(tenantId)
			const res = await client.responses.create({
				model: 'gpt-4o-mini',
				input: [
					{ role: 'system', content: header },
					{ role: 'user', content: body },
				],
				max_output_tokens: 400,
			})
			summary = (res.output_text ?? '').trim()
		} catch (err) {
			// Log best-effort, não propague erro para não quebrar encerramento
			try {
				logger.error('ai_chat_final_summary_create_failed', {
					component: 'AIChatFinalSummary',
					tenantId,
					phone,
					err,
				})
			} catch {}
			summary = ''
		}

		const concise = summary.slice(0, 2000)
		try {
			await this.prisma.aIChatSession.update({
				where: { id: session.id },
				data: { finalSummary: concise },
			})
		} catch (err) {
			try {
				logger.error('ai_chat_final_summary_persist_failed', {
					component: 'AIChatFinalSummary',
					tenantId,
					phone,
					err,
				})
			} catch {}
		}
		return concise
	}
}
