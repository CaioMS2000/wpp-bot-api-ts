import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { WhatsAppMessageService } from '@/domain/whats-app/application/services/whats-app-message-service'
import { parseWhatsAppMessage } from '@/infra/database/utils/parse-whatsapp-message'

type Resources = {
    whatsAppMessageService: WhatsAppMessageService
}

export async function whatsAppWebhook(
    app: FastifyInstance,
    { whatsAppMessageService }: Resources
) {
    app.withTypeProvider<ZodTypeProvider>().post('/webhook', {
        handler: async (req, reply) => {
            try {
                const { from, to, message } = parseWhatsAppMessage(req.body)

                await whatsAppMessageService.processIncomingMessage(
                    from,
                    to,
                    message
                )

                return reply.status(200).send({ status: 'ok' })
            } catch (err: any) {
                req.log.error({ err }, 'Erro ao processar mensagem')
                return reply.status(400).send({ error: err.message })
            }
        },
    })
}
