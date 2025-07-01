import { WhatsAppMessageService } from '@/domain/whats-app/application/services/whats-app-message-service'
import { parseWhatsAppMessage } from '@/infra/database/utils/parse-whatsapp-message'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

const TAG = '[webhook]'

type Resources = {
    whatsAppMessageService: WhatsAppMessageService
}

export async function whatsAppWebhook(
    app: FastifyInstance,
    { whatsAppMessageService }: Resources
) {
    app.withTypeProvider<ZodTypeProvider>().post('/webhook', {
        handler: async (req, reply) => {
            req.log.info(TAG, 'Evento recebido do webhook')

            const parsed = parseWhatsAppMessage(req.body)

            if (!parsed) {
                req.log.info(
                    TAG,
                    'Evento não é uma mensagem de usuário. Ignorado.'
                )
                return reply.status(200).send({ status: 'ignored' })
            }

            const { from, to, message, name } = parsed

            try {
                req.log.info(
                    TAG,
                    `Mensagem recebida de ${from} para ${to}: ${message}`
                )

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
                    message:
                        'Mensagem recebida, mas houve um erro interno ao processar.',
                }) // evita retry do WhatsApp
            }
        },
    })
}
