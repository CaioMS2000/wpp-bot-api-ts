import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { ExtractResources } from '../@types'
import { authenticateWithPassword } from './authenticate-with-password'
import { logout } from './logout'
import { register } from './register-manager'

const routes = [authenticateWithPassword, register, logout] as const

type Resources = ExtractResources<typeof routes>

export const router = fastifyPlugin(
	async (app: FastifyInstance, resources: Resources) => {
		app.register(authenticateWithPassword, {
			authService: resources.authService,
		})
		app.register(register, { authService: resources.authService })
		app.register(logout)
	}
)
