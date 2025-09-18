import { env } from '@/config/env'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

const VERIFICATION_TOKEN = env.VERIFICATION_TOKEN

const webhookQuerySchema = z.object({
	'hub.verify_token': z.string(),
	'hub.challenge': z.string(),
})

export async function webhook(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().get('/', {
		schema: {
			tags: ['Webhook'],
			querystring: webhookQuerySchema,
		},
		handler: async (req, reply) => {
			const query = req.query

			if (query['hub.verify_token'] === VERIFICATION_TOKEN) {
				console.info('Webhook verified successfully.')
				return reply
					.status(200)
					.header('Content-Type', 'text/plain')
					.send(query['hub.challenge'])
			}

			return reply.status(401).send({ error: 'Invalid verification token' })
		},
	})
}
