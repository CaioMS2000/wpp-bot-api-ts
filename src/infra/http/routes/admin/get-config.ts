import { AppError } from '@/infra/http/errors'
import type { GlobalConfigRepository } from '@/repository/GlobalConfigRepository'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../middlewares/auth'
import { getResponse, keyParam } from './schemas'

type Resources = { globalConfigRepository: GlobalConfigRepository }

export async function getPlatformConfig(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get('/api/admin/config/:key', {
			schema: {
				tags: ['Admin'],
				summary: 'Get global platform config by key',
				params: keyParam,
				response: { 200: getResponse },
			},
			handler: async (req, reply) => {
				await req.getPlatformAdmin()

				const item = await resources.globalConfigRepository.get(req.params.key)
				if (!item)
					throw AppError.notFound(
						'NOT_FOUND',
						'Chave de configuração não encontrada.'
					)
				return reply.send({ ...item, updatedAt: item.updatedAt.toISOString() })
			},
		})
}
