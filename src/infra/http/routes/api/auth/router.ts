import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { ExtractResources } from '../@types'
import { authenticateWithPassword } from './authenticate-with-password'
import { logout } from './logout'
import { me } from './me'
import { register } from './register-manager'
import { updateManager } from './update-manager'

const routes = [
	authenticateWithPassword,
	register,
	logout,
	me,
	updateManager,
] as const

type Resources = ExtractResources<typeof routes>

export const router = fastifyPlugin(
	async (app: FastifyInstance, resources: Resources) => {
		app.register(authenticateWithPassword, {
			authService: resources.authService,
		})
		app.register(register, { authService: resources.authService })
		app.register(me, {
			managerService: resources.managerService,
			companyService: resources.companyService,
		})
		app.register(updateManager, {
			managerService: resources.managerService,
		})
		app.register(logout)
	}
)
