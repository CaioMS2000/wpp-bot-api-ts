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
	name: z.string().min(3),
	phone: z.string().optional().nullable().default(null),
})

export async function register(app: FastifyInstance, resources: Resources) {
	app.withTypeProvider<ZodTypeProvider>().post('/api/sessions/signup', {
		schema: {
			body: bodySchema,
			response: { 204: z.null().describe('No Content') },
		},
		handler: async (req, reply) => {
			const { email, password, name, phone } = req.body
			await resources.authService.registerManager(name, email, password, phone)

			return reply.status(204).send()
		},
	})
}
