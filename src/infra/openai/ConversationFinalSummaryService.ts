import type { PrismaClient } from '@prisma/client'
import type OpenAI from 'openai'
import { OpenAIClientRegistry } from './OpenAIClientRegistry'

export class ConversationFinalSummaryService {
	constructor(
		private readonly prisma: PrismaClient,
		private readonly clientRegistry: OpenAIClientRegistry
	) {}

	async summarizeConversation(
		tenantId: string,
		conversationId: string
	): Promise<string | null> {
		const convo = await this.prisma.conversation.findFirst({
			where: { id: conversationId, tenantId },
			select: { id: true, endedAt: true, finalSummary: true },
		})
		if (!convo || !convo.endedAt) return null
		if (convo.finalSummary != null) return convo.finalSummary

		const messages = await this.prisma.message.findMany({
			where: { conversationId },
			orderBy: { createdAt: 'asc' },
			select: { sender: true, text: true },
		})

		if (!messages.length) {
			await this.prisma.conversation.update({
				where: { id: conversationId },
				data: { finalSummary: '' },
			})
			return ''
		}

		const header = [
			'Resuma a conversa entre cliente e atendente de forma concisa e objetiva.',
			'Inclua dúvidas, informações fornecidas, decisões e próximos passos.',
			'Não inclua dados sensíveis. Não faça perguntas. Máx. ~12 linhas.',
		].join('\n')

		const lines = messages.map(
			m => `[${m.sender === 'EMPLOYEE' ? 'Funcionário' : 'Cliente'}] ${m.text}`
		)
		const raw = lines.join('\n')
		const MAX_CHARS = 14000
		const body = raw.length > MAX_CHARS ? raw.slice(-MAX_CHARS) : raw

		let summary = ''
		try {
			const client: OpenAI =
				await this.clientRegistry.getClientForTenant(tenantId)
			const r = await client.responses.create({
				model: 'gpt-4o-mini',
				input: [
					{ role: 'system', content: header },
					{ role: 'user', content: body },
				],
				max_output_tokens: 400,
			})
			summary = (r.output_text ?? '').trim()
		} catch (err) {
			try {
				console.error(
					'[ConversationFinalSummary] failed to create summary',
					err
				)
			} catch {}
			summary = ''
		}

		const concise = summary.slice(0, 2000)
		try {
			await this.prisma.conversation.update({
				where: { id: conversationId },
				data: { finalSummary: concise },
			})
		} catch (err) {
			try {
				console.error(
					'[ConversationFinalSummary] failed to persist summary',
					err
				)
			} catch {}
		}
		return concise
	}
}
