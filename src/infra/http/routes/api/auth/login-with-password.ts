import { env } from '@/config/env'
import { AuthService } from '@/modules/web-api/services/auth-service'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

type Resources = {
	authService: AuthService
}

export const bodySchema = z.object({
	email: z.string().email(),
	password: z.string().min(3),
})
export const responseSchema = {
	200: z.object({
		user: z.object({
			id: z.string(),
			email: z.string().email(),
			name: z.string(),
			tenantId: z.string().optional().nullable(),
			role: z.enum(['ADMIN', 'EMPLOYEE']),
		}),
		token: z.string(),
	}),
}

export async function loginWithPassword(
	app: FastifyInstance,
	resources: Resources
) {
	app.withTypeProvider<ZodTypeProvider>().post('/api/sessions/password', {
		schema: {
			tags: ['Auth'],
			summary: 'Login with email and password',
			body: bodySchema,
			response: responseSchema,
		},
		handler: async (req, reply) => {
			const { email, password } = req.body
			const user = await resources.authService.loginWithPassword(
				email,
				password
			)
			const token = await reply.jwtSign(
				{
					sub: user.id,
				},
				{
					sign: { expiresIn: '7d' },
				}
			)

			reply.setCookie(env.HTTP_COOKIE_NAME, token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
				path: '/',
				maxAge: 60 * 60 * 24 * 7,
			})

			return reply.status(200).send({ user, token })
		},
	})
}
