import { registerBodySchema } from '@/domain/web-api/@types/schemas'
import { AuthService } from '@/domain/web-api/services/auth-service'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'

type Resources = {
	authService: AuthService
}

export async function register(app: FastifyInstance, resources: Resources) {
	app.withTypeProvider<ZodTypeProvider>().post('/api/sessions/signup', {
		schema: {
			body: registerBodySchema,
		},
		handler: async (req, reply) => {
			console.log('register request with the following body:\n', req.body)

			const { email, password, name, phone } = req.body

			const result = await resources.authService.registerManager(
				name,
				email,
				password,
				phone
			)

			return reply.status(200).send({
				...result,
			})
		},
	})
}
