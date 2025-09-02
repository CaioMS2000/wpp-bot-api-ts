import { env } from '@/config/env'
import { Client } from '@/entities/client'
import { parseWhatsAppMessage } from '@/infra/database/utils/parse-whatsapp-message'
import { logger } from '@/logger'
import { WhatsAppMessageService } from '@/modules/whats-app/services/whats-app-message-service'
import { appendRequestLog } from '@/utils/log-in-file'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { WhatsAppOutputPort } from '../../output/whats-app-output-port'

type Resources = {
	whatsAppMessageService: WhatsAppMessageService
}
const tempOutput = new WhatsAppOutputPort()
const testPhones = env.TEST_NUMBERS.split(';')
console.log('\n\ntestPhones:\n', testPhones)

function shouldForward(req: any, from: string): boolean {
	// evita loop: se já chegou com o cabeçalho e o segredo certo, não reenvia
	const fwdHeader = req.headers['x-wpp-forwarded']
	const isAlreadyForwarded =
		typeof fwdHeader === 'string' ? fwdHeader === env.FORWARD_SECRET : false

	const isHosted = env.NODE_ENV === 'production'
	const isTestingFlag = env.TESTING_APP === 'yes'
	const hasTarget = !!env.LOCAL_FORWARD_URL && !!env.FORWARD_SECRET

	return (
		isHosted &&
		isTestingFlag &&
		hasTarget &&
		testPhones.includes(from) &&
		!isAlreadyForwarded
	)
}
export async function receiveMessage(
	app: FastifyInstance,
	{ whatsAppMessageService }: Resources
) {
	app.withTypeProvider<ZodTypeProvider>().post('/', {
		handler: async (req, reply) => {
			logger.debug('Evento recebido do webhook')

			// @ts-ignore - Temporary test phone validation
			const entry0 = (req.body as any)?.entry?.[0]
			const change0 = entry0?.changes?.[0]
			const msg = change0?.value?.messages?.[0]
			const hasMessage = !!msg

			if (!hasMessage) {
				return reply.status(200).send({ status: 'ignored' })
			}

			// @ts-ignore - Temporary test phone validation
			const _from = msg.from as string
			const toDisplay = change0?.value?.metadata?.display_phone_number as string
			// @ts-ignore - Temporary test phone validation
			const _name = change0?.value?.contacts?.[0]?.profile?.name ?? undefined

			// 2) Regra temporária de "ignorar alguns números"
			if (!testPhones.includes(_from) && env.TESTING_APP === 'yes') {
				await appendRequestLog({
					at: new Date().toISOString(),
					reason: 'rejected_phone',
					from: _from,
					to: toDisplay,
					name: _name,
					body: req.body,
					headers: req.headers,
					ip: req.ip,
				})

				logger.debug(
					`Mensagem recebida de ${_from}(${_name}) para ${toDisplay}: ${JSON.stringify(msg)}`
				)

				return await tempOutput.handle(
					Client.create({
						name: 'Teste',
						phone: _from,
						companyId: '1',
					}),
					{
						type: 'text',
						content:
							'🔔 *Nosso atendimento online está passando por manutenção. Em breve retornaremos com mais informações. Agradecemos a compreensão.*',
					}
				)
			}

			if (shouldForward(req, _from)) {
				try {
					const res = await fetch(`${env.LOCAL_FORWARD_URL}/`, {
						method: 'POST',
						headers: {
							'content-type': 'application/json',
							// marca e autentica o forward (evita loops e acessos indevidos)
							'x-wpp-forwarded': env.FORWARD_SECRET as string,
							'x-forwarded-for': req.ip ?? '',
						},
						body: JSON.stringify(req.body),
					})

					if (!res.ok) {
						const text = await res.text().catch(() => '')
						logger.warn(
							{ status: res.status, text },
							'Forward para local falhou'
						)
						// fallback: processa aqui mesmo para não perder mensagem
					} else {
						logger.debug('Forward para local OK')
						// Já deu certo no local — responde 200 pra evitar retry do WhatsApp
						return reply.status(200).send({ status: 'ok', forwarded: true })
					}
				} catch (e) {
					logger.error({ err: e }, 'Erro no forward para local')
					// fallback continua abaixo
				}
			}

			console.log('\nraw body:\n', JSON.stringify(req.body, null, 2))
			const parsed = parseWhatsAppMessage(req.body)
			console.log('\nparsed body:\n', parsed)

			if (!parsed) {
				logger.debug('Evento não é uma mensagem de usuário. Ignorado.')
				return reply.status(200).send({ status: 'ignored' })
			}

			const { from, to, name, content } = parsed

			try {
				logger.debug(`Mensagem recebida de ${from} para ${to}:\n`, content)

				await whatsAppMessageService.processIncomingMessage(
					from,
					to,
					content,
					name
				)

				logger.debug('Mensagem processada ao serviço com sucesso')
				return reply.status(200).send({ status: 'ok' })
			} catch (err: any) {
				logger.error({ err }, 'Erro ao processar mensagem')
				return reply.status(200).send({
					status: 'ok',
					message: 'Mensagem recebida, mas houve um erro interno ao processar.',
				}) // evita retry do WhatsApp
			}
		},
	})
}
