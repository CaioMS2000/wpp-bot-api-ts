import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { AppError } from '@/infra/http/errors'

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
	app.addHook('preHandler', async (req, reply) => {
		req.getCurrentUserID = async () => {
			try {
				const { sub } = await req.jwtVerify<{ sub: string }>({
					onlyCookie: true,
				})
				return sub
			} catch {
				throw AppError.unauthenticated(
					'Sessão inválida ou expirada.',
					'Faça login novamente.'
				)
			}
		}

		req.getAdminMembership = async (cnpj: string) => {
			try {
				const userId = await req.getCurrentUserID()
				const result = await req.authService.getAdminMembership(cnpj, userId)
				return result
			} catch {
				throw AppError.unauthenticated(
					'Sessão inválida ou expirada.',
					'Faça login novamente.'
				)
			}
		}

		// Platform-level admin: role ADMIN and no tenant bound (tenantId null)
		req.getPlatformAdmin = async () => {
			try {
				const userId = await req.getCurrentUserID()
				const user = await req.authService.getPlatformAdmin(userId)
				return user
			} catch (e) {
				throw AppError.forbidden(
					'Acesso restrito ao administrador da plataforma.'
				)
			}
		}
	})
})
