import { AppError } from '@/infra/http/errors'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../../middlewares/auth'

export const paramsSchema = z.object({
	cnpj: z.string(),
})
const ErrorEnvelope = z.object({
	error: z.object({
		code: z.string(),
		message: z.string(),
		hint: z.string().optional(),
		details: z.any().optional(),
	}),
})
export const responseSchema = {
	200: z.object({
		id: z.string(),
		name: z.string(),
		cnpj: z.string().min(1),
		phone: z.string().min(1),
		site: z.string().nullable().optional(),
		email: z.string().email().nullable().optional(),
		description: z.string().nullable().optional(),
		createdAt: z.date(),
		updatedAt: z.date(),
	}),
	403: ErrorEnvelope,
}

export async function getTenant(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get('/api/tenant/:cnpj', {
			schema: {
				tags: ['Tenant'],
				summary: 'Get tenant by CNPJ',
				params: paramsSchema,
				response: responseSchema,
			},
			handler: async (req, reply) => {
				const userId = await req.getCurrentUserID()
				const { admin, tenant } = await req.getAdminMembership(req.params.cnpj)

				if (admin.id !== userId)
					throw AppError.forbidden(
						'Você não tem permissão para acessar este tenant.'
					)

				return reply.status(200).send({
					id: tenant.id,
					name: tenant.name,
					cnpj: tenant.cnpj,
					phone: tenant.phone,
					site: tenant.site ?? null,
					email: tenant.email ?? null,
					description: tenant.description ?? null,
					createdAt: tenant.createdAt,
					updatedAt: tenant.updatedAt,
				})
			},
		})
}
