import type { TenantRepository } from '@/repository/TenantRepository'
import type { UserRepository } from '@/repository/UserRepository'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../../middlewares/auth'

type Resources = {
	tenantRepository: TenantRepository
	userRepository: UserRepository
}

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
}

export async function createTenant(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post('/api/tenant', {
			schema: {
				tags: ['Tenant'],
				summary: 'Create a tenant',
				body: bodySchema,
				response: responseSchema,
			},
			handler: async (req, reply) => {
				const { name, cnpj, phone, site, email, description, businessHours } =
					req.body
				const tenant = await resources.tenantRepository.create({
					name,
					cnpj,
					phone,
					site: site ?? null,
					email: email ?? null,
					description: description ?? null,
					businessHours: businessHours ?? null,
				})

				const userId = await req.getCurrentUserID()
				await resources.userRepository.setTenant(userId, tenant.id)

				return reply.status(200).send({
					id: tenant.id,
					name: tenant.name,
					cnpj: tenant.cnpj,
					phone: tenant.phone,
					site: tenant.site ?? null,
					email: tenant.email ?? null,
					description: tenant.description ?? null,
					businessHours: tenant.businessHours ?? null,
					createdAt: tenant.createdAt,
					updatedAt: tenant.updatedAt,
				})
			},
		})
}
