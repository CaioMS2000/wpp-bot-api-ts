import type { CustomerServiceContext } from '@/modules/main/CustomerServiceContext'
import { CustomerServiceContextManager } from '@/modules/main/CustomerServiceContextManager'
import { parseWhatsAppMessage } from '@/utils/parse-whatsapp-message'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
// processamento de PDF é feito na camada de IA
import type { PrismaClient } from '@prisma/client'

import type { MessageQueue } from '@/infra/jobs/MessageQueue'

type Resources = {
	customerServiceManager: CustomerServiceContextManager
	prisma: PrismaClient
	messageQueue: MessageQueue
}

export async function receiveMessage(
	app: FastifyInstance,
	{ customerServiceManager, prisma, messageQueue }: Resources
) {
	app.withTypeProvider<ZodTypeProvider>().post('/', {
		schema: {
			tags: ['Webhook'],
			summary: 'Receive WhatsApp message webhook',
		},
		handler: async (req, reply) => {
			const parsed = parseWhatsAppMessage(req.body)

			if (!parsed) {
				console.log('Evento não é uma mensagem de usuário. Ignorado.')
				return reply.status(200).send({ status: 'ignored' })
			}

			const { from, to, name, content } = parsed
			console.log('[Webhook] incoming content', {
				kind: content.kind,
				from,
				to,
			})
			// Resolve tenant primeiro
			const found = await prisma.tenant.findUnique({
				where: { phone: to },
				select: { id: true },
			})
			if (!found?.id) {
				console.warn('[Webhook] Tenant não encontrado para phone', { to })
				return reply
					.status(200)
					.send({ status: 'ignored', reason: 'unknown-tenant' })
			}
			const tenantId = found.id

			// Extrai messageId bruto do payload do WhatsApp (idempotência)
			const entry0 = (req.body as any)?.entry?.[0]
			const msgId = String(entry0?.changes?.[0]?.value?.messages?.[0]?.id ?? '')
			if (!msgId) {
				console.warn('[Webhook] message.id ausente no payload')
			}

			// Enfileira job e responde 200 imediatamente (ACK rápido)
			await messageQueue.enqueue({
				kind: 'inbound',
				tenantId,
				messageId:
					msgId || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
				from,
				to,
				name,
				content: {
					kind: content.kind,
					text: (content as any).text,
					title: (content as any).title,
					media: (content as any).media
						? {
								id: String((content as any).media.id),
								filename: (content as any).media.filename,
								mime: (content as any).media.mime,
							}
						: undefined,
				},
				receivedAt: new Date().toISOString(),
			})
			return reply.status(200).send({ status: 'accepted' })
		},
	})
}
