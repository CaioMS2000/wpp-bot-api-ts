import { AppError } from '@/infra/http/errors'
import type { TenantRepository } from '@/repository/TenantRepository'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../../middlewares/auth'

type Resources = { tenantRepository: TenantRepository }

export const paramsSchema = z.object({
	cnpj: z.string(),
})
const dayHours = z.object({
	open: z.number().int().min(0).max(1439),
	close: z.number().int().min(0).max(1439),
})
const businessHours = z.object({
	mon: dayHours,
	tue: dayHours,
	wed: dayHours,
	thu: dayHours,
	fri: dayHours,
	sat: dayHours,
	sun: dayHours,
})
export const bodySchema = z.object({
	name: z.string().min(1),
	cnpj: z.string().min(1),
	phone: z.string().min(1),
	site: z.string().min(1).optional(),
	email: z.string().email().optional(),
	description: z.string().min(1).optional(),
	businessHours: businessHours.optional(),
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
		businessHours: businessHours.nullable().optional(),
		createdAt: z.date(),
		updatedAt: z.date(),
	}),
	403: ErrorEnvelope,
}

export async function updateTenant(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.put('/api/tenant/:cnpj', {
			schema: {
				tags: ['Tenant'],
				summary: 'Update a tenant',
				body: bodySchema,
				response: responseSchema,
				params: paramsSchema,
			},
			handler: async (req, reply) => {
				const userId = await req.getCurrentUserID()
				const { name, phone, cnpj, site, email, description, businessHours } =
					req.body as z.infer<typeof bodySchema>
				const { manager, tenant } = await req.getManagerMembership(
					req.params.cnpj
				)

				if (manager.id !== userId)
					throw AppError.forbidden(
						'Você não tem permissão para atualizar este tenant.'
					)

				const updatedTenant = await resources.tenantRepository.update(
					tenant.id,
					{
						name,
						cnpj,
						phone,
						site: site ?? null,
						email: email ?? null,
						description: description ?? null,
						businessHours: businessHours ?? tenant.businessHours ?? null,
					}
				)

				return reply.status(200).send({
					id: updatedTenant.id,
					name: updatedTenant.name,
					cnpj: updatedTenant.cnpj,
					phone: updatedTenant.phone,
					site: updatedTenant.site ?? null,
					email: updatedTenant.email ?? null,
					description: updatedTenant.description ?? null,
					businessHours: updatedTenant.businessHours ?? null,
					createdAt: updatedTenant.createdAt,
					updatedAt: updatedTenant.updatedAt,
				})
			},
		})
}
