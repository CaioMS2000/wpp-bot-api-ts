import type { PrismaClient, $Enums } from '@prisma/client'
import { logger as _logger } from '@/infra/logging/logger'
import {
	ConversationLogger,
	FileConversationLogger,
} from './ConversationLogger'

type Role = 'CLIENT' | 'EMPLOYEE'

type LogMeta = {
	tenantId: string
	conversationId: string
	userPhone: string
	role: Role
}

type Usage = { input_tokens?: number; output_tokens?: number }

type MessageEntry = {
	at: string
	kind: 'user' | 'ai' | 'event'
	text: string
	model?: string
	responseId?: string
	usage?: Usage
	system?: string
	tools?: string[]
	vectorStoreId?: string | null
	fileSearch?: {
		results: Array<{
			fileId?: string
			fileName?: string
			fileKey?: string
			score?: number
			snippet?: string
		}>
	}
	tool?: {
		name: string
		args?: string
		output?: string
		error?: string
	}
}

function mapRole(r: Role): $Enums.ConversationAuditRole {
	return r === 'EMPLOYEE' ? 'EMPLOYEE' : 'CLIENT'
}

function mapKind(k: MessageEntry['kind']): $Enums.ConversationMessageKind {
	switch (k) {
		case 'user':
			return 'USER'
		case 'ai':
			return 'AI'
		default:
			return 'EVENT'
	}
}

export class ConversationAuditLogger extends ConversationLogger {
	private prisma?: PrismaClient
	private file?: ConversationLogger
	private enableDb: boolean

	constructor(opts: {
		prisma?: PrismaClient
		file?: FileConversationLogger
		enableDb?: boolean
	}) {
		super()
		this.prisma = opts.prisma
		this.file = opts.file
		this.enableDb = Boolean(opts.enableDb)
	}

	async init(meta: LogMeta): Promise<void> {
		// File sink (best-effort)
		await this.file?.init(meta).catch(() => {})

		if (!this.enableDb || !this.prisma) return
		try {
			await this.prisma.conversationLog.upsert({
				where: {
					tenantId_conversationId: {
						tenantId: meta.tenantId,
						conversationId: meta.conversationId,
					},
				},
				update: {},
				create: {
					tenantId: meta.tenantId,
					conversationId: meta.conversationId,
					userPhone: meta.userPhone,
					role: mapRole(meta.role),
					startedAt: new Date(),
				},
			})
		} catch (err) {
			_logger.warn('conversation_audit_init_failed', { err })
		}
	}

	async append(meta: LogMeta, entry: MessageEntry): Promise<void> {
		// File sink (best-effort)
		await this.file?.append(meta, entry).catch(() => {})

		if (!this.enableDb || !this.prisma) return
		try {
			// Ensure header exists (idempotent)
			await this.prisma.conversationLog.upsert({
				where: {
					tenantId_conversationId: {
						tenantId: meta.tenantId,
						conversationId: meta.conversationId,
					},
				},
				update: {},
				create: {
					tenantId: meta.tenantId,
					conversationId: meta.conversationId,
					userPhone: meta.userPhone,
					role: mapRole(meta.role),
					startedAt: new Date(),
				},
			})

			await this.prisma.conversationMessage.create({
				data: {
					log: {
						connect: {
							tenantId_conversationId: {
								tenantId: meta.tenantId,
								conversationId: meta.conversationId,
							},
						},
					},
					at: new Date(entry.at),
					kind: mapKind(entry.kind),
					text: entry.text,
					model: entry.model ?? null,
					responseId: entry.responseId ?? null,
					usageJson: entry.usage ? { ...entry.usage } : undefined,
					system: entry.system ?? null,
					toolsJson: entry.tools ? [...entry.tools] : undefined,
					vectorStoreId: entry.vectorStoreId ?? null,
					fileSearchJson: entry.fileSearch
						? { ...entry.fileSearch }
						: undefined,
					toolJson: entry.tool ? { ...entry.tool } : undefined,
				},
			})
		} catch (err) {
			_logger.warn('conversation_audit_append_failed', { err })
		}
	}
}
