import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../../middlewares/auth'
import { paramsByCnpj, queueResponse } from './schemas'
import type { PrismaClient } from '@prisma/client'

type Resources = { prisma: PrismaClient }

export async function getQueue(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get('/api/metrics/:cnpj/queue', {
			schema: {
				tags: ['Metrics'],
				summary: 'Get waiting queue counts',
				params: paramsByCnpj,
				response: queueResponse,
			},
			handler: async (req, reply) => {
				const { prisma } = resources
				const { tenant } = await req.getAdminMembership(req.params.cnpj)

				const rows = await prisma.departmentQueueEntry.groupBy({
					by: ['departmentId'],
					where: { tenantId: tenant.id },
					_count: { _all: true },
				})
				if (!rows.length)
					return reply.send({ totalQueued: 0, byDepartment: [] })

				const deptIds = rows.map(r => r.departmentId)
				const depts = await prisma.department.findMany({
					where: { id: { in: deptIds } },
					select: { id: true, name: true },
				})
				const nameById = new Map(depts.map(d => [d.id, d.name]))
				const byDepartment = rows.map(r => ({
					name: nameById.get(r.departmentId) ?? 'Sem departamento',
					count: r._count._all,
				}))
				const totalQueued = byDepartment.reduce((acc, x) => acc + x.count, 0)
				return reply.send({ totalQueued, byDepartment })
			},
		})
}
