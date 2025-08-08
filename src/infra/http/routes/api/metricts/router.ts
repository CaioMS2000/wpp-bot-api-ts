import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { ExtractResources } from '../@types'
import { getBaseMetrics } from './base-metrics'
import { getDepartmentsMetrics } from './departments-metricts'
import { getWeekConversationsMetrics } from './get-week-conversations-metrics'

const routes = [
	getWeekConversationsMetrics,
	getDepartmentsMetrics,
	getBaseMetrics,
] as const

type Resources = ExtractResources<typeof routes>

export const router = fastifyPlugin(
	async (app: FastifyInstance, resources: Resources) => {
		app.register(getWeekConversationsMetrics, {
			getWeekConversationsMetrics: resources.getWeekConversationsMetrics,
		})
		app.register(getDepartmentsMetrics, {
			getDepartmentsMetricsUseCase: resources.getDepartmentsMetricsUseCase,
		})
		app.register(getBaseMetrics, {
			getBaseMetricsUseCase: resources.getBaseMetricsUseCase,
		})
	}
)
