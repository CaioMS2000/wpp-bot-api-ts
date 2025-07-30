import { Client } from '@/domain/entities/client'
import { WhatsAppMessageService } from '@/domain/whats-app/application/services/whats-app-message-service'
import { parseWhatsAppMessage } from '@/infra/database/utils/parse-whatsapp-message'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { WhatsAppOutputPort } from '../../output/whats-app-output-port'
import { logger } from '@/core/logger'

const TAG = '[webhook]'

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
			req.log.info(TAG, 'Evento recebido do webhook')

			// @ts-ignore - Temporary test phone validation
			const entry = req.body?.entry
			const x = entry?.[0]?.changes?.[0]?.value?.messages?.[0].from
			const y = entry?.[0]?.changes?.[0]?.value?.metadata?.display_phone_number
			const z = entry?.[0]?.changes?.[0]?.value?.messages?.[0]

			if (!testPhones.includes(x)) {
				const name =
					entry?.[0]?.changes?.[0]?.value?.contacts?.[0]?.profile?.name ??
					undefined

				logger.debug(TAG, `Mensagem recebida de ${x}(${name}) para ${y}: ${z}`)

				return await tempOutput.handle(
					Client.create({
						name: 'Teste',
						phone: `${entry?.[0]?.changes?.[0]?.value?.messages?.[0].from}`,
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
				req.log.info(TAG, 'Evento não é uma mensagem de usuário. Ignorado.')
				return reply.status(200).send({ status: 'ignored' })
			}

			const { from, to, message, name } = parsed

			try {
				req.log.info(TAG, `Mensagem recebida de ${from} para ${to}: ${message}`)

				await whatsAppMessageService.processIncomingMessage(
					from,
					to,
					message,
					name
				)

				req.log.info(TAG, 'Mensagem encaminhada ao serviço com sucesso')
				return reply.status(200).send({ status: 'ok' })
			} catch (err: any) {
				req.log.error({ err }, `${TAG} Erro ao processar mensagem`)
				return reply.status(200).send({
					status: 'ok',
					message: 'Mensagem recebida, mas houve um erro interno ao processar.',
				}) // evita retry do WhatsApp
			}
		},
	})
}
