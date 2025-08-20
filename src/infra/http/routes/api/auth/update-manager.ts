import { ManagerService } from '@/modules/web-api/services/manager-service'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

type Resources = {
	managerService: ManagerService
}
export const paramsSchema = z.object({
	email: z.string(),
})

export const bodySchema = z.object({
	email: z.string().optional(),
	name: z.string().optional(),
	phone: z.string().optional().nullable(),
})

export const responseSchema = {
	200: z.object({
		data: z.object({
			email: z.string(),
			name: z.string(),
			phone: z.string().nullable(),
		}),
	}),
}

export async function updateManager(
	app: FastifyInstance,
	resources: Resources
) {
	app.withTypeProvider<ZodTypeProvider>().put('/api/registry/manager/:email', {
		schema: {
			body: bodySchema,
			response: responseSchema,
			params: paramsSchema,
		},
		handler: async (req, reply) => {
			const { email, name, phone } = req.body

			const result = await resources.managerService.update(req.params.email, {
				name,
				email,
				phone,
			})

			return reply.status(200).send({ data: result })
		},
	})
}
