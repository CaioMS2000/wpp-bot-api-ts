import { env } from '@/config/env'
import type { FastifyInstance } from 'fastify'

export async function logout(app: FastifyInstance) {
	app.post('/api/sessions/logout', async (req, reply) => {
		reply.clearCookie(env.HTTP_COOKIE_NAME, { path: '/' })
		return reply.status(200).send({ message: 'Logout successful' })
	})
}
