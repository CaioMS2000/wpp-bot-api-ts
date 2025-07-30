import { logger } from '@/core/logger'
import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
	app.addHook('preHandler', async (req, reply) => {
		req.getCurrentUserID = async () => {
			try {
				const { sub } = await req.jwtVerify<{ sub: string }>()

				return sub
			} catch (err) {
				throw { statusCode: 401, message: '[getCurrentUserID] Invalid token' }
			}
		}

		req.getUserMembership = async (cnpj: string) => {
			try {
				const userId = await req.getCurrentUserID()

				logger.debug(
					`Fetching user membership for CNPJ: ${cnpj} and user ID: ${userId}`
				)
				const result = await req.authService.getManagerMembership(cnpj, userId)

				return result
			} catch (err) {
				logger.error(`Error fetching user membership for CNPJ: ${cnpj}\n`, err)
				throw { statusCode: 401, message: '[getUserMembership] Invalid token' }
			}
		}
	})
})
