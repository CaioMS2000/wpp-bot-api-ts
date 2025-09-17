import { StateSnapshot, StateStore } from '@/repository/StateStore'
import { PrismaClient } from '@prisma/client'

export class PrismaStateStore implements StateStore {
	constructor(private readonly prisma: PrismaClient) {}

	async load(tenantId: string, phone: string): Promise<StateSnapshot | null> {
		const row = await this.prisma.sessionContext.findUnique({
			where: { tenantId_phone: { tenantId, phone } },
			select: { state: true, data: true, version: true, aiSessionId: true },
		})
		if (!row) return null
		let parsed: unknown
		try {
			parsed = row.data ? JSON.parse(row.data) : undefined
		} catch {
			parsed = undefined
		}
		// Reduz ruído: não logar leituras de snapshot em produção
		return {
			state: row.state,
			data: parsed,
			version: row.version,
			aiSessionId: row.aiSessionId,
		}
	}

	async save(
		tenantId: string,
		phone: string,
		state: string,
		data?: unknown,
		aiSessionId?: string | null
	): Promise<StateSnapshot> {
		const serialized = data === undefined ? null : JSON.stringify(data)
		// Reduz ruído: não logar intenção de salvar; mantermos apenas confirmação abaixo
		const updated = await this.prisma.sessionContext.upsert({
			where: { tenantId_phone: { tenantId, phone } },
			update: {
				state,
				data: serialized,
				aiSessionId,
				version: { increment: 1 },
			},
			create: {
				tenantId,
				phone,
				state,
				data: serialized,
				aiSessionId,
			},
			select: { state: true, data: true, version: true, aiSessionId: true },
		})
		try {
			console.log('[StateStore] saved', {
				phone,
				state: updated.state,
				version: updated.version,
			})
		} catch {}
		return {
			state: updated.state,
			data: updated.data ? JSON.parse(updated.data) : undefined,
			version: updated.version,
			aiSessionId: updated.aiSessionId,
		}
	}

	async clear(tenantId: string, phone: string): Promise<void> {
		await this.prisma.sessionContext.deleteMany({ where: { tenantId, phone } })
	}
}
