import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { auth } from '../../middlewares/auth'
import type { Prisma, PrismaClient } from '@prisma/client'
import { AuditStorage } from '@/infra/storage/AuditStorage'

type Resources = { prisma: PrismaClient }

const listQuery = z.object({
	from: z.string().datetime().optional(),
	to: z.string().datetime().optional(),
	page: z.coerce.number().int().min(1).default(1),
	pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
const paramsByCnpj = z.object({ cnpj: z.string() })

export async function router(app: FastifyInstance, resources: Resources) {
	const { prisma } = resources
	const storage = new AuditStorage()

	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get('/api/tenant/:cnpj/audit/conversations', {
			schema: {
				tags: ['Audit', 'Admin'],
				summary: 'List audit conversations (DB-first with S3 archive info)',
				querystring: listQuery,
				params: paramsByCnpj,
			},
			handler: async (req, reply) => {
				// Allow SYSTEM_ADMIN (platform) or MANAGER (tenant-bound)
				const { cnpj } = req.params
				let tenantId: string
				try {
					// If SYSTEM_ADMIN, resolve tenant by CNPJ directly
					await req.getPlatformAdmin()
					const t = await prisma.tenant.findUnique({ where: { cnpj } })
					if (!t) return reply.status(404).send({ error: 'tenant_not_found' })
					tenantId = t.id
				} catch {
					// Else, require manager membership
					const { tenant } = await req.getManagerMembership(cnpj)
					tenantId = tenant.id
				}
				const { from, to, page, pageSize } = req.query
				const where: Prisma.ConversationLogWhereInput = { tenantId }
				if (from || to) {
					where.startedAt = {}
					if (from) where.startedAt.gte = new Date(from)
					if (to) where.startedAt.lte = new Date(to)
				}
				const [total, rows] = await Promise.all([
					prisma.conversationLog.count({ where }),
					prisma.conversationLog.findMany({
						where,
						orderBy: { startedAt: 'desc' },
						skip: (page - 1) * pageSize,
						take: pageSize,
						select: {
							id: true,
							tenantId: true,
							conversationId: true,
							userPhone: true,
							role: true,
							startedAt: true,
							closedAt: true,
							archivedAt: true,
							purgeAt: true,
							s3Uri: true,
							_count: { select: { messages: true } },
						},
					}),
				])
				const items = rows.map(r => ({
					conversationId: r.conversationId,
					userPhone: r.userPhone,
					role: r.role,
					startedAt: r.startedAt.toISOString(),
					closedAt: r.closedAt ? r.closedAt.toISOString() : null,
					archivedAt: r.archivedAt ? r.archivedAt.toISOString() : null,
					purgeAt: r.purgeAt ? r.purgeAt.toISOString() : null,
					s3Uri: r.s3Uri ?? null,
					source: r._count.messages > 0 ? 'DB' : r.s3Uri ? 'S3' : 'UNKNOWN',
				}))
				return reply.send({ total, page, pageSize, items })
			},
		})

		.get('/api/tenant/:cnpj/audit/conversations/:conversationId', {
			schema: {
				tags: ['Audit', 'Admin'],
				summary: 'Get a unified conversation transcript (DB or S3)',
				params: paramsByCnpj.extend({ conversationId: z.string() }),
			},
			handler: async (req, reply) => {
				// Allow SYSTEM_ADMIN (platform) or MANAGER (tenant-bound)
				const { cnpj, conversationId } = req.params
				let tenantId: string
				try {
					await req.getPlatformAdmin()
					const t = await prisma.tenant.findUnique({ where: { cnpj } })
					if (!t) return reply.status(404).send({ error: 'tenant_not_found' })
					tenantId = t.id
				} catch {
					const { tenant } = await req.getManagerMembership(cnpj)
					tenantId = tenant.id
				}

				const head = await prisma.conversationLog.findUnique({
					where: { tenantId_conversationId: { tenantId, conversationId } },
					select: {
						id: true,
						tenantId: true,
						conversationId: true,
						userPhone: true,
						role: true,
						startedAt: true,
						closedAt: true,
						s3Uri: true,
						_count: { select: { messages: true } },
					},
				})
				if (!head) return reply.status(404).send({ error: 'not_found' })

				if (head._count.messages > 0) {
					const msgs = await prisma.conversationMessage.findMany({
						where: { logId: head.id },
						orderBy: { at: 'asc' },
						select: {
							at: true,
							kind: true,
							text: true,
							model: true,
							responseId: true,
							usageJson: true,
							system: true,
							toolsJson: true,
							vectorStoreId: true,
							fileSearchJson: true,
							toolJson: true,
						},
					})
					return reply.send({
						source: 'DB',
						meta: {
							tenantId: head.tenantId,
							conversationId: head.conversationId,
							userPhone: head.userPhone,
							role: head.role,
							startedAt: head.startedAt.toISOString(),
							closedAt: head.closedAt ? head.closedAt.toISOString() : null,
						},
						messages: msgs.map(m => ({
							at: m.at.toISOString(),
							kind: m.kind,
							text: m.text,
							model: m.model ?? undefined,
							responseId: m.responseId ?? undefined,
							usage: m.usageJson ?? undefined,
							system: m.system ?? undefined,
							tools: m.toolsJson ?? undefined,
							vectorStoreId: m.vectorStoreId ?? undefined,
							fileSearch: m.fileSearchJson ?? undefined,
							tool: m.toolJson ?? undefined,
						})),
					})
				}

				if (head.s3Uri) {
					const obj = await storage.getJsonUri<any>(head.s3Uri)
					if (obj) return reply.send({ source: 'S3', ...obj })
				}
				return reply.status(404).send({ error: 'not_found_export' })
			},
		})
}
