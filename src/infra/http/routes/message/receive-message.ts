import { WhatsAppMessageService } from '@/domain/whats-app/application/services/whats-app-message-service'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

type Resources = {
    whatsAppMessageService: WhatsAppMessageService
}

const receiveMessageBodySchema = z.object({
    from: z.string().min(10),
    to: z.string().min(10),
    message: z.string(),
})

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

            await whatsAppMessageService.processIncomingMessage(
                req.body.from,
                req.body.to,
                req.body.message
            )

            return reply.status(201).send({ message: 'Messagege received' })
        },
    })
}
