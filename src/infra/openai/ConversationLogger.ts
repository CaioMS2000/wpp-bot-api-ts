import { promises as fs } from 'node:fs'
import * as path from 'node:path'

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

type LogFile = {
	meta: LogMeta & { startedAt: string }
	messages: MessageEntry[]
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
	typeof v === 'object' && v !== null

// Base abstrata para sinks de auditoria de conversa
export abstract class ConversationLogger {
	abstract init(meta: {
		tenantId: string
		conversationId: string
		userPhone: string
		role: 'CLIENT' | 'EMPLOYEE'
	}): Promise<void>

	abstract append(
		meta: {
			tenantId: string
			conversationId: string
			userPhone: string
			role: 'CLIENT' | 'EMPLOYEE'
		},
		entry: {
			at: string
			kind: 'user' | 'ai' | 'event'
			text: string
			model?: string
			responseId?: string
			usage?: { input_tokens?: number; output_tokens?: number }
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
			tool?: { name: string; args?: string; output?: string; error?: string }
		}
	): Promise<void>
}

// Implementação baseada em arquivo (dev)
export class FileConversationLogger extends ConversationLogger {
	constructor(
		private readonly enabled: boolean,
		private readonly baseDir = path.join(process.cwd(), 'logs', 'conversations')
	) {
		super()
	}

	private dateFolder(): string {
		const d = new Date()
		const yyyy = d.getUTCFullYear()
		const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
		const dd = String(d.getUTCDate()).padStart(2, '0')
		return `${yyyy}-${mm}-${dd}`
	}

	private async ensureDir(): Promise<void> {
		if (!this.enabled) return
		const dir = path.join(this.baseDir, this.dateFolder())
		await fs.mkdir(dir, { recursive: true })
	}

	private sanitize(s: string): string {
		return s.replace(/[^a-zA-Z0-9_-]+/g, '_')
	}

	private filePath(tenantId: string, conversationId: string): string {
		const name = `${this.sanitize(tenantId)}__${this.sanitize(conversationId)}.json`
		const dir = path.join(this.baseDir, this.dateFolder())
		return path.join(dir, name)
	}

	private coerceLogFile(v: unknown): LogFile | null {
		if (!isRecord(v)) return null
		const metaVal = v['meta']
		const msgsVal = v['messages']
		if (!isRecord(metaVal) || !Array.isArray(msgsVal)) return null
		const metaCandidate: Partial<LogFile['meta']> = {}
		const keys: Array<keyof LogFile['meta']> = [
			'tenantId',
			'conversationId',
			'userPhone',
			'role',
			'startedAt',
		]
		for (const k of keys) {
			const val = (metaVal as Record<string, unknown>)[k as string]
			if (typeof val === 'string') (metaCandidate as any)[k] = val
		}
		if (
			typeof metaCandidate.tenantId !== 'string' ||
			typeof metaCandidate.conversationId !== 'string' ||
			typeof metaCandidate.userPhone !== 'string' ||
			typeof metaCandidate.role !== 'string' ||
			typeof metaCandidate.startedAt !== 'string'
		)
			return null
		const messages: MessageEntry[] = []
		for (const m of msgsVal) {
			if (!isRecord(m)) continue
			const at = m['at']
			const kind = m['kind']
			const text = m['text']
			if (
				typeof at !== 'string' ||
				typeof kind !== 'string' ||
				typeof text !== 'string'
			)
				continue
			const entry: MessageEntry = {
				at,
				kind:
					kind === 'user' || kind === 'ai' || kind === 'event'
						? (kind as 'user' | 'ai' | 'event')
						: 'event',
				text,
			}
			const model = m['model']
			if (typeof model === 'string') entry.model = model
			const responseId = m['responseId']
			if (typeof responseId === 'string') entry.responseId = responseId
			const usage = m['usage']
			if (isRecord(usage)) {
				const it = usage['input_tokens']
				const ot = usage['output_tokens']
				entry.usage = {
					input_tokens: typeof it === 'number' ? it : undefined,
					output_tokens: typeof ot === 'number' ? ot : undefined,
				}
			}
			const system = m['system']
			if (typeof system === 'string') entry.system = system
			const tools = m['tools']
			if (Array.isArray(tools))
				entry.tools = tools.filter(x => typeof x === 'string') as string[]
			const vs = m['vectorStoreId']
			if (typeof vs === 'string' || vs === null) entry.vectorStoreId = vs
			const fsr = m['fileSearch']
			if (isRecord(fsr)) {
				const results = fsr['results']
				if (Array.isArray(results)) {
					const hits: Array<{
						fileId?: string
						fileName?: string
						fileKey?: string
						score?: number
						snippet?: string
					}> = []
					for (const r of results) {
						if (!isRecord(r)) continue
						const fileId = r['fileId']
						const fileName = r['fileName']
						const fileKey = (r as any)['fileKey'] ?? (r as any)['key']
						const score = r['score']
						const snippet = r['snippet']
						hits.push({
							fileId: typeof fileId === 'string' ? fileId : undefined,
							fileName: typeof fileName === 'string' ? fileName : undefined,
							fileKey: typeof fileKey === 'string' ? fileKey : undefined,
							score: typeof score === 'number' ? score : undefined,
							snippet: typeof snippet === 'string' ? snippet : undefined,
						})
					}
					entry.fileSearch = { results: hits }
				}
			}
			const tool = m['tool']
			if (isRecord(tool)) {
				const name = tool['name']
				const args = tool['args']
				const output = tool['output']
				const error = tool['error']
				entry.tool = {
					name: typeof name === 'string' ? name : 'unknown',
					args: typeof args === 'string' ? args : undefined,
					output: typeof output === 'string' ? output : undefined,
					error: typeof error === 'string' ? error : undefined,
				}
			}
			messages.push(entry)
		}
		return { meta: metaCandidate as LogFile['meta'], messages }
	}

	private async readFile(fp: string): Promise<LogFile | null> {
		try {
			const raw = await fs.readFile(fp, 'utf8')
			const parsed = JSON.parse(raw)
			return this.coerceLogFile(parsed)
		} catch {
			return null
		}
	}

	private async writeFile(fp: string, data: LogFile): Promise<void> {
		const json = JSON.stringify(data, null, 2)
		await fs.writeFile(fp, json, 'utf8')
	}

	async init(meta: LogMeta): Promise<void> {
		if (!this.enabled) return
		await this.ensureDir()
		const fp = this.filePath(meta.tenantId, meta.conversationId)
		const existing = await this.readFile(fp)
		if (existing) return
		const fresh: LogFile = {
			meta: { ...meta, startedAt: new Date().toISOString() },
			messages: [],
		}
		await this.writeFile(fp, fresh)
	}

	async append(meta: LogMeta, entry: MessageEntry): Promise<void> {
		if (!this.enabled) return
		await this.ensureDir()
		const fp = this.filePath(meta.tenantId, meta.conversationId)
		const current = (await this.readFile(fp)) ?? {
			meta: { ...meta, startedAt: new Date().toISOString() },
			messages: [],
		}
		current.messages.push(entry)
		await this.writeFile(fp, current)
	}
}
