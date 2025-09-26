import type { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { AppError } from '@/infra/http/errors'

export const auth = fastifyPlugin(async (app: FastifyInstance) => {
	app.addHook('preHandler', async (req, reply) => {
		req.getCurrentUserID = async () => {
			// First, try cookie (recommended flow)
			try {
				const { sub } = await req.jwtVerify<{ sub: string }>({
					onlyCookie: true,
				})
				return sub
			} catch {}
			// Fallback: try Authorization: Bearer <token>
			try {
				const { sub } = await req.jwtVerify<{ sub: string }>()
				return sub
			} catch {
				throw AppError.unauthenticated(
					'Sessão inválida ou expirada.',
					'Faça login novamente.'
				)
			}
		}

		req.getManagerMembership = async (cnpj: string) => {
			// 1) Garantir usuário autenticado
			let userId: string
			try {
				userId = await req.getCurrentUserID()
			} catch {
				throw AppError.unauthenticated(
					'Sessão inválida ou expirada.',
					'Faça login novamente.'
				)
			}
			// 2) Verificar vinculo ao tenant; preservar erros de autorização
			try {
				return await req.authService.getManagerMembership(cnpj, userId)
			} catch (e) {
				if (e instanceof AppError) throw e
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
