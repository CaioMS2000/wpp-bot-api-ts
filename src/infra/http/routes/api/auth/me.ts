import type { TenantRepository } from '@/repository/TenantRepository'
import { UserRepository } from '@/repository/UserRepository'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'
import { auth } from '../../middlewares/auth'

type Resources = {
	userRepository: UserRepository
	tenantRepository: TenantRepository
}

const responseSchema = {
	200: z.object({
		user: z.object({
			id: z.string(),
			email: z.string(),
			name: z.string(),
			phone: z.string(),
			tenantCnpj: z.string().nullable(),
		}),
	}),
	204: z.null(),
}
export async function me(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get('/api/me', {
			schema: {
				tags: ['Auth'],
				summary: 'Me',
				response: responseSchema,
			},
			handler: async (req, reply) => {
				const userId = await req.getCurrentUserID()
				const user = await resources.userRepository.getAdminById(userId)

				if (!user) {
					return reply.status(204).send()
				}

				let tenantCnpj: string | null = null
				if (user.tenantId) {
					const tenant = await resources.tenantRepository.get(user.tenantId)
					tenantCnpj = tenant?.cnpj ?? null
				}

				return reply.status(200).send({
					user: {
						id: user.id,
						email: user.email,
						name: user.name,
						phone: user.phone,
						tenantCnpj,
					},
				})
			},
		})
}
