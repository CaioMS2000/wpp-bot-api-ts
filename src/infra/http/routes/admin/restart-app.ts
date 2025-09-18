import type { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'
import type { GlobalConfigService } from '@/infra/config/GlobalConfigService'

const responseSchema = {
	200: z.object({ restarted: z.literal(true), serviceId: z.string() }),
	400: z.object({
		error: z.object({
			code: z.string(),
			message: z.string(),
			hint: z.string().optional(),
		}),
	}),
	502: z.object({
		error: z.object({
			code: z.string(),
			message: z.string(),
			details: z.any().optional(),
		}),
	}),
}

type Resources = { globalConfig: GlobalConfigService }

export async function restartApp(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post('/api/admin/restart', {
			schema: {
				tags: ['Admin'],
				summary: 'Restart application on Render',
				response: responseSchema,
			},
			handler: async (req, reply) => {
				await req.getPlatformAdmin()

				const apiKey = await resources.globalConfig.getString(
					'RENDER_API_KEY',
					''
				)
				const serviceId = await resources.globalConfig.getString(
					'APP_SERVICE_ID',
					''
				)
				if (!apiKey || !serviceId) {
					return reply.status(400).send({
						error: {
							code: 'RENDER_NOT_CONFIGURED',
							message:
								'Integração não configurada. Defina as chaves globais RENDER_API_KEY e APP_SERVICE_ID.',
							hint: 'Use /api/admin/config para configurar as chaves e tente novamente.',
						},
					})
				}

				try {
					const url = `https://api.render.com/v1/services/${serviceId}/restart`
					const res = await fetch(url, {
						method: 'POST',
						headers: {
							Authorization: `Bearer ${apiKey}`,
							Accept: 'application/json',
						},
					})
					if (!res.ok) {
						const text = await res.text().catch(() => '')
						return reply.status(502).send({
							error: {
								code: 'RENDER_RESTART_FAILED',
								message: `Falha ao solicitar restart no Render (status ${res.status}).`,
								details: text,
							},
						})
					}
					return reply.send({ restarted: true, serviceId })
				} catch (err: any) {
					return reply.status(502).send({
						error: {
							code: 'RENDER_REQUEST_ERROR',
							message: 'Erro ao contatar a API do Render.',
							details: String(err?.message ?? err),
						},
					})
				}
			},
		})
}
