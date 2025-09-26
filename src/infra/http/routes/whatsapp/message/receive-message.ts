import { CustomerServiceContextManager } from '@/modules/main/CustomerServiceContextManager'
import { parseWhatsAppMessage } from '@/utils/parse-whatsapp-message'
import type { PrismaClient } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import { trace, SpanStatusCode } from '@opentelemetry/api'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

import { env } from '@/config/env'
import type { GlobalConfigService } from '@/infra/config/GlobalConfigService'
import type { MessageQueue } from '@/infra/jobs/MessageQueue'
import { logger as _logger } from '@/infra/logging/logger'
import { inc } from '@/infra/logging/metrics'

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
			const tracer = trace.getTracer('wpp-api')
			return tracer.startActiveSpan('whatsapp.receive', async span => {
				try {
					span.setAttribute('http.route', 'webhook.receive')
					span.setAttribute('component', 'whatsapp.webhook')
					// 1) Extração mínima do payload bruto para regras de teste/forward/manutenção
					const entry0 = (req.body as any)?.entry?.[0]
					const change0 = entry0?.changes?.[0]
					const msg = change0?.value?.messages?.[0]
					const hasMessage = !!msg

					if (!hasMessage) {
						span.setAttribute('webhook.has_message', false)
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
					const testNumbersRaw = await globalConfig.get('TEST_NUMBERS', [])
					const forwardUrl = await globalConfig.getString(
						'LOCAL_FORWARD_URL',
						''
					)
					const forwardSecret = await globalConfig.getString(
						'FORWARD_SECRET',
						''
					)

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
					const testPhones = Array.isArray(testNumbersRaw)
						? (testNumbersRaw as any[])
								.map(v => String(v).trim())
								.filter(Boolean)
						: typeof testNumbersRaw === 'string'
							? (testNumbersRaw as string)
									.split(';')
									.map(s => s.trim())
									.filter(Boolean)
							: []

					// 1.a) Regra de manutenção: somente números de teste passam quando em manutenção
					if (!testPhones.includes(rawFrom) && isMaintenance) {
						span.addEvent('maintenance_gate', { rawFrom })
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
							_logger.warn('webhook_maintenance_notify_failed', {
								component: 'whatsapp.webhook',
								err: e,
							})
						}
						return reply.status(200).send({ status: 'maintenance' })
					}

					// 1.b) Forward condicional para ambiente local (evita loops via header secreto)
					function shouldForward(): boolean {
						const fwdHeader = req.headers['x-wpp-forwarded']
						const isAlreadyForwarded =
							typeof fwdHeader === 'string'
								? fwdHeader === forwardSecret
								: false
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
						span.addEvent('forward_attempt', { target: forwardUrl })
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
								_logger.warn('webhook_forward_failed', {
									component: 'whatsapp.webhook',
									status: res.status,
									text,
								})
								// fallback continua abaixo
							}
						} catch (e) {
							_logger.error('webhook_forward_error', {
								component: 'whatsapp.webhook',
								err: e,
							})
							// fallback continua abaixo
						}
					}

					// 2) Fluxo normal de processamento
					const parsed = parseWhatsAppMessage(req.body)

					if (!parsed) {
						span.setAttribute('webhook.parsed', false)
						_logger.info('webhook_ignored_non_user_message', {
							component: 'whatsapp.webhook',
						})
						return reply.status(200).send({ status: 'ignored' })
					}

					const { from, to, name, content } = parsed
					_logger.info('webhook_incoming_content', {
						component: 'whatsapp.webhook',
						kind: content.kind,
						from,
						to,
					})
					span.setAttribute('msg.kind', String(content.kind))
					span.setAttribute('msg.from', from)
					span.setAttribute('msg.to', to)
					// Resolve tenant primeiro
					const found = await prisma.tenant.findUnique({
						where: { phone: to },
						select: { id: true },
					})
					if (!found?.id) {
						span.setStatus({
							code: SpanStatusCode.ERROR,
							message: 'unknown-tenant',
						})
						_logger.warn('webhook_unknown_tenant', {
							component: 'whatsapp.webhook',
							to,
						})
						return reply
							.status(200)
							.send({ status: 'ignored', reason: 'unknown-tenant' })
					}
					const tenantId = found.id
					span.setAttribute('tenant.id', tenantId)

					// Extrai messageId bruto do payload do WhatsApp (idempotência)
					const msgId = String(
						entry0?.changes?.[0]?.value?.messages?.[0]?.id ?? ''
					)
					if (!msgId) {
						_logger.warn('webhook_missing_message_id', {
							component: 'whatsapp.webhook',
						})
					}

					// Structured log for webhook receipt
					try {
						const logger = _logger.child({
							component: 'whatsapp.webhook',
							tenantId,
							messageId: msgId || undefined,
							from,
							to,
						})
						logger.info('webhook_received', { kind: content.kind })
					} catch {}

					// Enfileira job e responde 200 imediatamente (ACK rápido)
					await tracer.startActiveSpan('queue.enqueue_inbound', async s => {
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
						s.end()
					})
					inc('webhook_inbound_total', { kind: content.kind })
					return reply.status(200).send({ status: 'accepted' })
				} catch (err: any) {
					span.recordException(err)
					span.setStatus({
						code: SpanStatusCode.ERROR,
						message: String(err?.message || err),
					})
					throw err
				} finally {
					span.end()
				}
			})
		},
	})
}
