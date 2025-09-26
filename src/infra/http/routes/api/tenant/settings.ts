import type { TenantRepository } from '@/repository/TenantRepository'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../../middlewares/auth'

type Resources = { tenantRepository: TenantRepository }

const paramsSchema = z.object({ cnpj: z.string().min(1) })
const getResponseSchema = {
	200: z.object({
		aiTokenApi: z.string().nullable(),
		metaTokenApi: z.string().nullable(),
		agentInstruction: z.string().nullable(),
	}),
}
const updateBodySchema = z.object({
	aiTokenApi: z.string().nullable().optional(),
	metaTokenApi: z.string().nullable().optional(),
	agentInstruction: z.string().nullable().optional(),
})
const updateResponseSchema = getResponseSchema

export async function tenantSettings(
	app: FastifyInstance,
	resources: Resources
) {
	const mask = (v: string | null) => {
		if (!v) return null
		const tail = v.slice(-4)
		return '*'.repeat(Math.max(0, v.length - 4)) + tail
	}
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get('/api/tenant/:cnpj/settings', {
			schema: {
				tags: ['Tenant'],
				summary: 'Get tenant settings (tokens)',
				params: paramsSchema,
				response: getResponseSchema,
			},
			handler: async (req, reply) => {
				const { tenant } = await req.getManagerMembership(req.params.cnpj)
				const s = await resources.tenantRepository.getSettings(tenant.id)
				return reply.send({
					aiTokenApi: mask(s.aiTokenApi),
					metaTokenApi: mask(s.metaTokenApi),
					agentInstruction: s.agentInstruction,
				})
			},
		})
		.put('/api/tenant/:cnpj/settings', {
			schema: {
				tags: ['Tenant'],
				summary: 'Update tenant settings (tokens)',
				params: paramsSchema,
				body: updateBodySchema,
				response: updateResponseSchema,
			},
			handler: async (req, reply) => {
				const { tenant } = await req.getManagerMembership(req.params.cnpj)
				// Partial update: only provided keys are changed; omitted keys are preserved by repository
				const s = await resources.tenantRepository.updateSettings(
					tenant.id,
					req.body
				)
				return reply.send({
					aiTokenApi: mask(s.aiTokenApi),
					metaTokenApi: mask(s.metaTokenApi),
					agentInstruction: s.agentInstruction,
				})
			},
		})
}
