import { WhatsAppMessageService } from '@/domain/whats-app/application/services/whats-app-message-service'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

type Resources = {
    whatsAppMessageService: WhatsAppMessageService
}
export async function receiveMessage(
    app: FastifyInstance,
    resources: Resources
) {
    app.withTypeProvider<ZodTypeProvider>().post('/message', {
        // schema: {
        // body: z.object({
        //     name: z.string().min(3),
        //     email: z.string().email(),
        //     password: z.string().min(6),
        // }),
        // response: {
        //     201: z.object({
        //         id: z.string().uuid(),
        //         email: z.string().email(),
        //     }),
        // },
        // },
        handler: async (req, reply) => {
            // const { email, password, name } = req.body
            // return reply.status(201).send({ email, password, name })
            const { whatsAppMessageService } = resources

            console.log('body')
            console.log(req.body)

            const res = await whatsAppMessageService.processIncomingMessage(
                req.body.clientPhone,
                req.body.messageContent
            )

            console.log('res')
            console.log(res)

            return reply.status(201).send({ message: 'Message received' })
        },
    })
}
