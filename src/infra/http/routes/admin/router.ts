import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { ExtractResources } from '../@types'
import { deletePlatformConfig } from './delete-config'
import { getPlatformConfig } from './get-config'
import { listPlatformConfig } from './list-config'
import { upsertPlatformConfig } from './upsert-config'
import { restartApp } from './restart-app'

const routes = [
	listPlatformConfig,
	getPlatformConfig,
	upsertPlatformConfig,
	deletePlatformConfig,
	restartApp,
] as const
type Resources = ExtractResources<typeof routes>

export const router = fastifyPlugin(
	async (
		app: FastifyInstance,
		resources: Resources & {
			globalConfig: import(
				'@/infra/config/GlobalConfigService'
			).GlobalConfigService
		}
	) => {
		app.register(listPlatformConfig, {
			globalConfigRepository: resources.globalConfigRepository,
			globalConfig: resources.globalConfig,
		})
		app.register(getPlatformConfig, {
			globalConfigRepository: resources.globalConfigRepository,
			globalConfig: resources.globalConfig,
		})
		app.register(upsertPlatformConfig, {
			globalConfigRepository: resources.globalConfigRepository,
			globalConfig: resources.globalConfig,
		})
		app.register(deletePlatformConfig, {
			globalConfigRepository: resources.globalConfigRepository,
			globalConfig: resources.globalConfig,
		})
		app.register(restartApp, { globalConfig: resources.globalConfig })
	}
)
