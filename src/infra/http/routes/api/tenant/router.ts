import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { ExtractResources } from '../../@types'
import { createTenant } from './create-tenant'
import { getTenant } from './get-tenant'
import { tenantSettings } from './settings'
import { updateTenant } from './update-tenant'

const routes = [getTenant, updateTenant, createTenant, tenantSettings] as const

type Resources = ExtractResources<typeof routes>

export const router = fastifyPlugin(
	async (app: FastifyInstance, resources: Resources) => {
		app.register(createTenant, {
			tenantRepository: resources.tenantRepository,
			userRepository: resources.userRepository,
		})
		app.register(updateTenant, {
			tenantRepository: resources.tenantRepository,
		})
		app.register(getTenant)
		app.register(tenantSettings, {
			tenantRepository: resources.tenantRepository,
		})
	}
)
