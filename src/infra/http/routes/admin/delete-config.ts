import type { GlobalConfigRepository } from '@/repository/GlobalConfigRepository'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../middlewares/auth'
import { keyParam } from './schemas'

type Resources = { globalConfigRepository: GlobalConfigRepository }

export async function deletePlatformConfig(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.delete('/api/admin/config/:key', {
			schema: {
				tags: ['Admin'],
				summary: 'Delete global platform config key',
				params: keyParam,
			},
			handler: async (req, reply) => {
				await req.getPlatformAdmin()
				await resources.globalConfigRepository.remove(req.params.key)
				return reply.status(204).send()
			},
		})
}
