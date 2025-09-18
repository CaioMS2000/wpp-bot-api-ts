import type { CustomerServiceContext } from '@/modules/main/CustomerServiceContext'
import { CustomerServiceContextManager } from '@/modules/main/CustomerServiceContextManager'
import { parseWhatsAppMessage } from '@/utils/parse-whatsapp-message'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
// processamento de PDF é feito na camada de IA
import type { PrismaClient } from '@prisma/client'

import type { MessageQueue } from '@/infra/jobs/MessageQueue'
import { env } from '@/config/env'
import type { GlobalConfigService } from '@/infra/config/GlobalConfigService'

type Resources = {
	customerServiceManager: CustomerServiceContextManager
	prisma: PrismaClient
	messageQueue: MessageQueue
	globalConfig: GlobalConfigService
}

export async function receiveMessage(
	app: FastifyInstance,
	{ customerServiceManager, prisma, messageQueue, globalConfig }: Resources
) {
	app.withTypeProvider<ZodTypeProvider>().post('/', {
		schema: {
			tags: ['Webhook'],
			summary: 'Receive WhatsApp message webhook',
		},
		handler: async (req, reply) => {
			// 1) Extração mínima do payload bruto para regras de teste/forward/manutenção
			const entry0 = (req.body as any)?.entry?.[0]
			const change0 = entry0?.changes?.[0]
			const msg = change0?.value?.messages?.[0]
			const hasMessage = !!msg

			if (!hasMessage) {
				return reply.status(200).send({ status: 'ignored' })
			}

			const rawFrom: string = String(msg.from ?? '')
			const toDisplay: string = String(
				change0?.value?.metadata?.display_phone_number ?? ''
			)
			const rawName: string | undefined =
				change0?.value?.contacts?.[0]?.profile?.name ?? undefined

			// Carrega configurações globais (com fallback para env)
			const testingFlagRaw = await globalConfig.get<string | boolean>(
				'TESTING_APP',
				'no'
			)
			const maintenanceFlagRaw = await globalConfig.get<string | boolean>(
				'MAINTENANCE_APP',
				'no'
			)
			const testNumbersStr = await globalConfig.getString('TEST_NUMBERS', '')
			const forwardUrl = await globalConfig.getString('LOCAL_FORWARD_URL', '')
			const forwardSecret = await globalConfig.getString('FORWARD_SECRET', '')

			function ynToBool(v: unknown, def: boolean) {
				if (typeof v === 'boolean') return v
				if (typeof v === 'string') {
					const s = v.toLowerCase()
					if (s === 'yes' || s === 'true' || s === '1') return true
					if (s === 'no' || s === 'false' || s === '0') return false
				}
				return def
			}

			const isTesting = ynToBool(testingFlagRaw, false)
			const isMaintenance = ynToBool(maintenanceFlagRaw, false)
			const testPhones = testNumbersStr
				.split(';')
				.map(s => s.trim())
				.filter(Boolean)

			// 1.a) Regra de manutenção: somente números de teste passam quando em manutenção
			if (!testPhones.includes(rawFrom) && isMaintenance) {
				try {
					// Tenta resolver tenant para envio de notificação
					const found = await prisma.tenant.findUnique({
						where: { phone: toDisplay },
						select: { id: true },
					})
					if (found?.id) {
						const ctxRes = await customerServiceManager.getContext(
							found.id,
							rawFrom
						)
						await ctxRes.context.sendMessage(
							'🔔 *Nosso atendimento online está passando por manutenção. Em breve retornaremos com mais informações. Agradecemos a compreensão.*'
						)
					}
				} catch (e) {
					console.warn('[Webhook] manutenção: falha ao enviar aviso', e)
				}
				return reply.status(200).send({ status: 'maintenance' })
			}

			// 1.b) Forward condicional para ambiente local (evita loops via header secreto)
			function shouldForward(): boolean {
				const fwdHeader = req.headers['x-wpp-forwarded']
				const isAlreadyForwarded =
					typeof fwdHeader === 'string' ? fwdHeader === forwardSecret : false
				const isHosted = env.NODE_ENV === 'production'
				const isTestingFlag = isTesting
				const hasTarget = !!forwardUrl && !!forwardSecret
				return (
					isHosted &&
					isTestingFlag &&
					hasTarget &&
					testPhones.includes(rawFrom) &&
					!isAlreadyForwarded
				)
			}

			if (shouldForward()) {
				try {
					const res = await fetch(`${forwardUrl}/`, {
						method: 'POST',
						headers: {
							'content-type': 'application/json',
							'x-wpp-forwarded': String(forwardSecret),
							'x-forwarded-for': (req.ip as any) ?? '',
						},
						body: JSON.stringify(req.body),
					})
					if (res.ok) {
						return reply.status(200).send({ status: 'ok', forwarded: true })
					} else {
						const text = await res.text().catch(() => '')
						console.warn('[Webhook] Forward para local falhou', {
							status: res.status,
							text,
						})
						// fallback continua abaixo
					}
				} catch (e) {
					console.error('[Webhook] Erro no forward para local', e)
					// fallback continua abaixo
				}
			}

			// 2) Fluxo normal de processamento
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
