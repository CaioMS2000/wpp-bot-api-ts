import { dayjs } from '@/config/date-and-time/dayjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../../middlewares/auth'
import { departmentQuery, departmentResponse, paramsByCnpj } from './schemas'
import type { PrismaClient } from '@prisma/client'

type Resources = { prisma: PrismaClient }

export async function getByDepartment(
	app: FastifyInstance,
	resources: Resources
) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get('/api/metrics/:cnpj/department', {
			schema: {
				tags: ['Metrics'],
				summary: 'Get metrics by department',
				params: paramsByCnpj,
				querystring: departmentQuery,
				response: departmentResponse,
			},
			handler: async (req, reply) => {
				const { prisma } = resources
				const { tenant } = await req.getManagerMembership(req.params.cnpj)

				const to = req.query.to ? dayjs(req.query.to) : dayjs().endOf('day')
				const from = req.query.from
					? dayjs(req.query.from)
					: dayjs().startOf('month')

				const convs = await prisma.conversation.findMany({
					where: {
						tenantId: tenant.id,
						startedAt: { gte: from.toDate(), lte: to.toDate() },
					},
					select: { department: { select: { name: true } } },
				})
				const map = new Map<string | null, number>()
				for (const c of convs) {
					const key = c.department?.name ?? null
					map.set(key, (map.get(key) ?? 0) + 1)
				}
				const items = Array.from(map.entries()).map(([department, count]) => ({
					department,
					count,
				}))
				return reply.send({ items })
			},
		})
}
