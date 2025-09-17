import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { ExtractResources } from '../../@types'
import { listHistory } from './list-history'
import { listRecent } from './list-recent'

const routes = [listHistory, listRecent] as const
type Resources = ExtractResources<typeof routes>

export const router = fastifyPlugin(
	async (app: FastifyInstance, resources: Resources) => {
		app.register(listHistory, { prisma: resources.prisma })
		app.register(listRecent, { prisma: resources.prisma })
	}
)
