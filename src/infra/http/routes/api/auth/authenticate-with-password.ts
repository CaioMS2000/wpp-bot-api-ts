import { AuthService } from '@/domain/web-api/services/auth-service'
import { authenticateBodySchema } from '@/domain/web-api/services/schemas'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

type Resources = {
	authService: AuthService
}

export async function authenticateWithPassword(
	app: FastifyInstance,
	resources: Resources
) {
	app.withTypeProvider<ZodTypeProvider>().post('/api/sessions/password', {
		schema: {
			body: authenticateBodySchema,
		},
		handler: async (req, reply) => {
			console.log('login request with the following body:\n', req.body)

			const { email, password } = req.body

			const { id, ...result } =
				await resources.authService.authenticateWithPassword(email, password)

			console.log('login result:\n', result)

			const token = await reply.jwtSign(
				{
					sub: id,
				},
				{
					sign: { expiresIn: '7d' },
				}
			)

			reply.setCookie('token', token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				path: '/',
				maxAge: 60 * 60 * 24 * 7,
			})

			return reply.status(200).send({
				user: {
					id,
					...result,
				},
			})
		},
	})
}
