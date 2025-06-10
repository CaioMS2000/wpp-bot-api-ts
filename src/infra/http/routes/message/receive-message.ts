import { WhatsAppMessageService } from '@/domain/whats-app/application/services/whats-app-message-service'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

type Resources = {
    whatsAppMessageService: WhatsAppMessageService
}

const receiveMessageBodySchema = z.union([
    z
        .object({
            'client-phone': z.string().min(3),
            'message-content': z.string().min(3),
        })
        .transform(data => ({
            clientPhone: data['client-phone'],
            messageContent: data['message-content'],
        })),
    z.object({
        clientPhone: z.string().min(10),
        messageContent: z.string(),
    }),
])

export async function receiveMessage(
    app: FastifyInstance,
    resources: Resources
) {
    app.withTypeProvider<ZodTypeProvider>().post('/message', {
        schema: {
            body: receiveMessageBodySchema,
            // response: {
            //     201: z.object({
            //         id: z.string().uuid(),
            //         email: z.string().email(),
            //     }),
            // },
        },
        handler: async (req, reply) => {
            // const { email, password, name } = req.body
            // return reply.status(201).send({ email, password, name })
            const { whatsAppMessageService } = resources

            // console.log('body')
            // console.log(req.body)

            const res = await whatsAppMessageService.processIncomingMessage(
                req.body.clientPhone,
                req.body.messageContent
            )

            return reply.status(201).send(res)
        },
    })
}
