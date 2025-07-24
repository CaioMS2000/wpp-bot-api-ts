import type { FastifyInstance } from 'fastify'

export async function logout(app: FastifyInstance) {
	app.post('/api/sessions/logout', async (req, reply) => {
		reply.clearCookie('token', { path: '/' })
		return reply.status(200).send({ message: 'Logout successful' })
	})
}
