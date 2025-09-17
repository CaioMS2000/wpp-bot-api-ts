import { dayjs } from '@/config/date-and-time/dayjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../../middlewares/auth'
import { paramsByCnpj, weeklyResponse } from './schemas'
import type { PrismaClient } from '@prisma/client'

type Resources = { prisma: PrismaClient }

export async function getWeekly(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get('/api/metrics/:cnpj/weekly', {
			schema: {
				tags: ['Metrics'],
				summary: 'Get weekly metrics',
				params: paramsByCnpj,
				response: weeklyResponse,
			},
			handler: async (req, reply) => {
				const { prisma } = resources
				const { tenant } = await req.getAdminMembership(req.params.cnpj)
				const now = dayjs()
				const start = now.startOf('week')
				const end = now.endOf('day')

				const convs = await prisma.conversation.findMany({
					where: {
						tenantId: tenant.id,
						startedAt: { gte: start.toDate(), lte: end.toDate() },
					},
					select: { id: true, startedAt: true, active: true, resolution: true },
					orderBy: { startedAt: 'asc' },
				})

				const days: Record<
					string,
					{ total: number; resolved: number; pending: number }
				> = {}
				for (let d = 0; d <= now.diff(start, 'day'); d++) {
					const key = start.add(d, 'day').format('YYYY-MM-DD')
					days[key] = { total: 0, resolved: 0, pending: 0 }
				}

				for (const c of convs) {
					const key = dayjs(c.startedAt).format('YYYY-MM-DD')
					const bucket = days[key]
					if (!bucket) continue
					bucket.total++
					if (c.active || c.resolution === 'UNRESOLVED') bucket.pending++
					if (c.resolution === 'RESOLVED') bucket.resolved++
				}

				const items = Object.entries(days).map(([date, v]) => ({ date, ...v }))
				return reply.send({ items })
			},
		})
}
