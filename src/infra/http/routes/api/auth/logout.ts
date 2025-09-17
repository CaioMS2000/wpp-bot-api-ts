import { env } from '@/config/env'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

export async function logout(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post('/api/sessions/logout', {
		schema: {
			tags: ['Auth'],
			summary: 'Logout current session',
		},
		handler: async (req, reply) => {
			reply.clearCookie(env.HTTP_COOKIE_NAME, { path: '/' })
			return reply.send({ ok: true })
		},
	})
}
