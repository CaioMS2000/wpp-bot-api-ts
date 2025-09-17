import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { ExtractResources } from '../../@types'
import { loginWithPassword } from './login-with-password'
import { logout } from './logout'
import { me } from './me'
import { signUp } from './sign-up'
import { updateMe } from './update-me'

const routes = [logout, signUp, loginWithPassword, me, updateMe] as const

type Resources = ExtractResources<typeof routes>

export const router = fastifyPlugin(
	async (app: FastifyInstance, resources: Resources) => {
		app.register(logout, { authService: resources.authService })
		app.register(signUp, { authService: resources.authService })
		app.register(loginWithPassword, { authService: resources.authService })
		app.register(me, {
			userRepository: resources.userRepository,
			tenantRepository: resources.tenantRepository,
		})
		app.register(updateMe, { authService: resources.authService })
	}
)
