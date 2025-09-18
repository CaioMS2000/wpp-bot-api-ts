import type { GlobalConfigRepository } from '@/repository/GlobalConfigRepository'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../middlewares/auth'
import { keyParam, upsertBody, upsertResponse } from './schemas'

type Resources = { globalConfigRepository: GlobalConfigRepository }

export async function upsertPlatformConfig(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.put('/api/admin/config/:key', {
			schema: {
				tags: ['Admin'],
				summary: 'Create/update global platform config key',
				params: keyParam,
				body: upsertBody,
				response: { 200: upsertResponse },
			},
			handler: async (req, reply) => {
				const user = await req.getPlatformAdmin()
				const saved = await resources.globalConfigRepository.upsert(
					req.params.key,
					(req.body as any).value,
					user.name
				)
				return reply.send({
					...saved,
					updatedAt: saved.updatedAt.toISOString(),
				})
			},
		})
}
