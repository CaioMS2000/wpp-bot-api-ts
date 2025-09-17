import { dayjs } from '@/config/date-and-time/dayjs'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../../middlewares/auth'
import { overviewQuery, overviewResponse, paramsByCnpj } from './schemas'
import type { PrismaClient } from '@prisma/client'

type Resources = { prisma: PrismaClient }

export async function getOverview(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get('/api/metrics/:cnpj/overview', {
			schema: {
				tags: ['Metrics'],
				summary: 'Get metrics overview',
				params: paramsByCnpj,
				querystring: overviewQuery,
				response: overviewResponse,
			},
			handler: async (req, reply) => {
				const { prisma } = resources
				const { tenant } = await req.getAdminMembership(req.params.cnpj)

				const scope = req.query.scope ?? 'month'
				const now = dayjs()
				const start =
					scope === 'day' ? now.startOf('day') : now.startOf('month')
				const end = now.endOf('day')

				// Conversations in scope
				const convs = await prisma.conversation.findMany({
					where: {
						tenantId: tenant.id,
						startedAt: { gte: start.toDate(), lte: end.toDate() },
					},
					select: { id: true, startedAt: true, arrivedAt: true },
				})
				const conversations = convs.length

				// Active customers in month
				const monthStart = now.startOf('month').toDate()
				const monthConvs = await prisma.conversation.findMany({
					where: {
						tenantId: tenant.id,
						startedAt: { gte: monthStart, lte: end.toDate() },
					},
					select: { customerPhone: true },
				})
				const activeCustomers = new Set(monthConvs.map(c => c.customerPhone))
					.size

				// Response rate: conversations with at least one EMPLOYEE message / total (in month)
				const monthConvIds = await prisma.conversation.findMany({
					where: {
						tenantId: tenant.id,
						startedAt: { gte: monthStart, lte: end.toDate() },
					},
					select: { id: true },
				})
				const ids = monthConvIds.map(c => c.id)
				let responded = 0
				if (ids.length) {
					const msgs = await prisma.message.findMany({
						where: { sender: 'EMPLOYEE', conversationId: { in: ids } },
						select: { conversationId: true },
						distinct: ['conversationId'],
					})
					responded = msgs.length
				}
				const totalMonth = monthConvIds.length || 1
				const responseRate = responded / totalMonth

				// Avg first response seconds in scope
				let sum = 0
				let count = 0
				for (const c of convs) {
					const firstEmp = await prisma.message.findFirst({
						where: { conversationId: c.id, sender: 'EMPLOYEE' },
						orderBy: { createdAt: 'asc' },
						select: { createdAt: true },
					})
					if (!firstEmp) continue
					const ref = c.arrivedAt ?? c.startedAt
					const diffSec = Math.floor(
						(firstEmp.createdAt.getTime() - ref.getTime()) / 1000
					)
					if (diffSec >= 0) {
						sum += diffSec
						count++
					}
				}
				const avgFirstResponseSeconds = count ? Math.round(sum / count) : null

				// AI sessions resolved (no handoff) in month
				const aiResolved = await prisma.aIChatSession.count({
					where: {
						tenantId: tenant.id,
						endedAt: { gte: monthStart, lte: end.toDate() },
						conversationId: null,
					},
				})

				return reply.send({
					conversations,
					activeCustomers,
					responseRate,
					avgFirstResponseSeconds,
					aiResolved,
				})
			},
		})
}
