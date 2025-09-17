import { AuthService } from '@/modules/web-api/services/auth-service'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../../middlewares/auth'

type Resources = { authService: AuthService }

const bodySchema = z
	.object({
		name: z.string().min(1).optional(),
		phone: z.string().min(1).optional(),
		email: z.string().email().optional(),
	})
	.refine(obj => Object.keys(obj).length > 0, {
		message: 'At least one field is required',
	})

const responseSchema = {
	200: z.object({
		user: z.object({
			id: z.string(),
			email: z.string(),
			name: z.string(),
			phone: z.string(),
			tenantId: z.string().nullable(),
		}),
	}),
}

export async function updateMe(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.put('/api/me', {
			schema: {
				tags: ['Auth'],
				summary: 'Update my profile',
				body: bodySchema,
				response: responseSchema,
			},
			handler: async (req, reply) => {
				const userId = await req.getCurrentUserID()
				const updated = await resources.authService.updateAdminProfile(
					userId,
					req.body
				)
				return reply.status(200).send({
					user: {
						id: updated.id,
						email: updated.email,
						name: updated.name,
						phone: updated.phone,
						tenantId: updated.tenantId,
					},
				})
			},
		})
}
