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
const testPhones = ['556292476996', '556293765723']

export async function whatsAppWebhook(
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
			if (!testPhones.includes(_from)) {
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
						phone: _from, // use a variável já validada
						companyId: '1',
					}),
					{
						type: 'text',
						content:
							'🔔 *Nosso atendimento online está passando por manutenção. Em breve retornaremos com mais informações. Agradecemos a compreensão.*',
					}
				)
			}

			const parsed = parseWhatsAppMessage(req.body)

			if (!parsed) {
				logger.debug('Evento não é uma mensagem de usuário. Ignorado.')
				return reply.status(200).send({ status: 'ignored' })
			}

			const { from, to, message, name } = parsed

			try {
				logger.debug(`Mensagem recebida de ${from} para ${to}: ${message}`)

				await whatsAppMessageService.processIncomingMessage(
					from,
					to,
					message,
					name
				)

				logger.debug('Mensagem encaminhada ao serviço com sucesso')
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
