import type { GlobalConfigRepository } from '@/repository/GlobalConfigRepository'
import type { GlobalConfigService } from '@/infra/config/GlobalConfigService'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../middlewares/auth'
import { listResponse } from './schemas'

type Resources = {
	globalConfigRepository: GlobalConfigRepository
	globalConfig?: GlobalConfigService
}

export async function listPlatformConfig(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get('/api/admin/config', {
			schema: {
				tags: ['Admin'],
				summary: 'List global platform config',
				response: { 200: listResponse },
			},
			handler: async (req, reply) => {
				await req.getPlatformAdmin()
				const items = await resources.globalConfigRepository.getAll()
				return reply.send({
					items: items.map(i => ({
						...i,
						updatedAt: i.updatedAt.toISOString(),
					})),
				})
			},
		})
}
