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
	name: z.string().min(1),
	phone: z.string().min(1),
})
export const responseSchema = { 204: z.null().describe('No Content') }

export async function signUp(app: FastifyInstance, resources: Resources) {
	app.withTypeProvider<ZodTypeProvider>().post('/api/sessions/signup', {
		schema: {
			tags: ['Auth'],
			summary: 'Sign up a new user',
			body: bodySchema,
			response: responseSchema,
		},
		handler: async (req, reply) => {
			const { email, password, name, phone } = req.body
			await resources.authService.signup(email, password, name, phone)

			return reply.status(204).send()
		},
	})
}
