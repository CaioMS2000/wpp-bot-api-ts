import { env } from '@/config/env'
import { ManagerService } from '@/modules/web-api/services/manager-service'
import { CompanyService } from '@/modules/whats-app/services/company-service'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../middlewares/auth'

type Resources = {
	managerService: ManagerService
	companyService: CompanyService
}

export const responseSchema = {
	200: z.object({
		user: z.object({
			name: z.string(),
			email: z.string(),
			id: z.string(),
			phone: z.string().nullable(),
			managedCompanyCNPJ: z.string().nullable(),
		}),
	}),
	401: z.object({
		error: z.string(),
	}),
}

export async function me(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get('/api/sessions/me', {
			schema: {
				response: responseSchema,
			},
			handler: async (req, reply) => {
				let managedCompanyCNPJ: Nullable<string> = null
				const id = await req.getCurrentUserID()
				const manager = await resources.managerService.getManager(id)

				if (!manager) {
					return reply.status(401).send({ error: 'Manager not found' })
				}

				const company = await resources.companyService.getCompanyByManagerId(id)

				if (company) {
					managedCompanyCNPJ = company.cnpj
				}

				return reply.status(200).send({
					user: {
						id,
						name: manager.name,
						email: manager.email,
						phone: manager.phone,
						managedCompanyCNPJ,
					},
				})
			},
		})
}
