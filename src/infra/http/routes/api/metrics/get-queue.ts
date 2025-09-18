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

				// Fetch queue entries ordered by arrival
				const entries = await prisma.departmentQueueEntry.findMany({
					where: { tenantId: tenant.id },
					select: { departmentId: true, customerPhone: true },
					orderBy: { createdAt: 'asc' },
				})
				if (entries.length === 0)
					return reply.send({ totalQueued: 0, byDepartment: [] })

				const deptIds = Array.from(new Set(entries.map(e => e.departmentId)))
				const phones = Array.from(new Set(entries.map(e => e.customerPhone)))

				const [depts, customers] = await Promise.all([
					prisma.department.findMany({
						where: { id: { in: deptIds } },
						select: { id: true, name: true },
					}),
					prisma.customer.findMany({
						where: { tenantId: tenant.id, phone: { in: phones } },
						select: { phone: true, name: true },
					}),
				])

				const deptNameById = new Map(depts.map(d => [d.id, d.name]))
				const customerNameByPhone = new Map(
					customers.map(c => [c.phone, c.name])
				)

				// Group entries by department
				const queueByDept = new Map<
					string,
					{ name: string; queue: { name: string; phone: string }[] }
				>()
				for (const e of entries) {
					const deptName =
						deptNameById.get(e.departmentId) ?? 'Sem departamento'
					if (!queueByDept.has(e.departmentId))
						queueByDept.set(e.departmentId, { name: deptName, queue: [] })
					const group = queueByDept.get(e.departmentId)!
					group.queue.push({
						name: customerNameByPhone.get(e.customerPhone) ?? '',
						phone: e.customerPhone,
					})
				}

				const byDepartment = Array.from(queueByDept.values())
				const totalQueued = entries.length
				return reply.send({ totalQueued, byDepartment })
			},
		})
}
