import { env } from '@/env'
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
			name: z.string(),
			email: z.string(),
			id: z.string(),
			phone: z.string().nullable(),
			managedCompanyCNPJ: z.string().nullable(),
		}),
	}),
}

export async function authenticateWithPassword(
	app: FastifyInstance,
	resources: Resources
) {
	app.withTypeProvider<ZodTypeProvider>().post('/api/sessions/password', {
		schema: {
			body: bodySchema,
			response: responseSchema,
		},
		handler: async (req, reply) => {
			const { email, password } = req.body
			const { id, ...result } =
				await resources.authService.authenticateWithPassword(email, password)
			const token = await reply.jwtSign(
				{
					sub: id,
				},
				{
					sign: { expiresIn: '7d' },
				}
			)

			reply.setCookie(env.HTTP_COOKIE_NAME, token, {
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
