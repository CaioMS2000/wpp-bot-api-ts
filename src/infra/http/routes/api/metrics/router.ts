import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { getOverview } from './get-overview'
import { getWeekly } from './get-weekly'
import { getByDepartment } from './get-by-department'
import { getQueue } from './get-queue'
import { ExtractResources } from '../../@types'

const routes = [getOverview, getWeekly, getByDepartment] as const
type Resources = ExtractResources<typeof routes>

export const router = fastifyPlugin(
	async (app: FastifyInstance, resources: Resources) => {
		app.register(getOverview, { prisma: resources.prisma })
		app.register(getWeekly, { prisma: resources.prisma })
		app.register(getByDepartment, { prisma: resources.prisma })
		app.register(getQueue, { prisma: resources.prisma })
	}
)
