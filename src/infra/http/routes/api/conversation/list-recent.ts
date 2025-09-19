import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { auth } from '../../middlewares/auth'
import { listResponse, paramsByCnpj } from './schemas'
import type { PrismaClient } from '@prisma/client'

type Resources = { prisma: PrismaClient }

export async function listRecent(app: FastifyInstance, resources: Resources) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get('/api/tenant/:cnpj/conversations/recent', {
			schema: {
				tags: ['Conversation'],
				summary: 'List the 5 most recent conversation and AI sessions',
				params: paramsByCnpj,
				response: listResponse,
			},
			handler: async (req, reply) => {
				const { prisma } = resources
				const { tenant } = await req.getAdminMembership(req.params.cnpj)
				const limit = 5

				const [convs, ai] = await Promise.all([
					prisma.conversation.findMany({
						where: { tenantId: tenant.id },
						orderBy: { startedAt: 'desc' },
						take: limit,
						select: {
							id: true,
							startedAt: true,
							endedAt: true,
							active: true,
							resolution: true,
							customerPhone: true,
							employee: { select: { name: true, phone: true } },
							department: { select: { name: true } },
							finalSummary: true,
							messages: {
								select: { sender: true, text: true, createdAt: true },
								orderBy: { createdAt: 'asc' },
							},
						},
					}),
					prisma.aIChatSession.findMany({
						where: { tenantId: tenant.id },
						orderBy: { startedAt: 'desc' },
						take: limit,
						select: {
							id: true,
							startedAt: true,
							endedAt: true,
							endReason: true,
							phone: true,
							conversationId: true,
							finalSummary: true,
							messages: {
								select: { sender: true, text: true, createdAt: true },
								orderBy: { createdAt: 'asc' },
							},
						},
					}),
				])

				// Resolve customer names from phone when available
				const phones = new Set<string>()
				for (const c of convs) phones.add(c.customerPhone)
				for (const s of ai) phones.add(s.phone)

				const phoneList = Array.from(phones)
				let nameByPhone = new Map<string, string>()
				let queuedPhones = new Set<string>()
				if (phoneList.length) {
					const [customers, queued] = await Promise.all([
						prisma.customer.findMany({
							where: { tenantId: tenant.id, phone: { in: phoneList } },
							select: { phone: true, name: true },
						}),
						prisma.departmentQueueEntry.findMany({
							where: { tenantId: tenant.id, customerPhone: { in: phoneList } },
							select: { customerPhone: true },
						}),
					])
					nameByPhone = new Map(customers.map(c => [c.phone, c.name]))
					queuedPhones = new Set(queued.map(q => q.customerPhone))
				}

				const convItems = convs.map(c => ({
					kind: 'CONVERSATION' as const,
					id: c.id,
					startedAt: c.startedAt.toISOString(),
					endedAt: c.endedAt ? c.endedAt.toISOString() : null,
					active: c.active,
					resolution: c.resolution,
					employeeName: c.employee.name,
					employeePhone: c.employee.phone,
					departmentName: c.department?.name ?? null,
					customerPhone: c.customerPhone,
					customerName: nameByPhone.get(c.customerPhone) ?? c.customerPhone,
					queued: queuedPhones.has(c.customerPhone),
					finalSummary: c.finalSummary ?? null,
					messages: c.messages.map(m => ({
						sender: m.sender,
						name:
							m.sender === 'EMPLOYEE'
								? c.employee.name
								: (nameByPhone.get(c.customerPhone) ?? c.customerPhone),
						text: m.text,
						createdAt: m.createdAt.toISOString(),
					})),
				}))

				const aiItems = ai.map(s => ({
					kind: 'AI' as const,
					id: s.id,
					startedAt: s.startedAt.toISOString(),
					endedAt: s.endedAt ? s.endedAt.toISOString() : null,
					endReason: s.endReason ?? null,
					customerPhone: s.phone,
					customerName: nameByPhone.get(s.phone) ?? s.phone,
					conversationId: s.conversationId ?? null,
					finalSummary: s.finalSummary ?? null,
					messages: s.messages.map(m => ({
						sender: m.sender,
						name:
							m.sender === 'AI' ? 'IA' : (nameByPhone.get(s.phone) ?? s.phone),
						text: m.text,
						createdAt: m.createdAt.toISOString(),
					})),
				}))

				const merged = [...convItems, ...aiItems]
					.sort(
						(a, b) =>
							new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
					)
					.slice(0, limit)
				try {
					const { logger } = await import('@/infra/logging/logger')
					logger.info('conversation_recent_counts', {
						component: 'conversation',
						tenantId: tenant.id,
						convs: convs.length,
						ai: ai.length,
						merged: merged.length,
					})
				} catch {}

				return reply.send({ items: merged })
			},
		})
}
