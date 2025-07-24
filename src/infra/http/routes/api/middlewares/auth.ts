import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
	app.addHook('preHandler', async (req, reply) => {
		req.getCurrentUserID = async () => {
			try {
				const { sub } = await req.jwtVerify<{ sub: string }>()

				return sub
			} catch (err) {
				throw new Error('Invalid token')
			}
		}

		req.getUserMembership = async (cnpj: string) => {
			try {
				const userId = await req.getCurrentUserID()
				const result = await req.authService.getManagerMembership(cnpj, userId)

				return result
			} catch (err) {
				throw new Error('Invalid token')
			}
		}
	})
})
