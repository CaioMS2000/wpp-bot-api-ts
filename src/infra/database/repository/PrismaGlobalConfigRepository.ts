import type { PrismaClient } from '@prisma/client'
import type {
	GlobalConfigRepository,
	GlobalSetting,
} from '@/repository/GlobalConfigRepository'

export class PrismaGlobalConfigRepository implements GlobalConfigRepository {
	constructor(private readonly prisma: PrismaClient) {}

	async getAll(): Promise<GlobalSetting[]> {
		const rows = await this.prisma.globalSetting.findMany({
			orderBy: { key: 'asc' },
		})
		return rows.map(r => ({
			key: r.key,
			value: r.value as unknown,
			version: r.version,
			updatedAt: r.updatedAt,
			updatedBy: r.updatedBy ?? null,
		}))
	}

	async get(key: string): Promise<GlobalSetting | null> {
		const r = await this.prisma.globalSetting.findUnique({ where: { key } })
		if (!r) return null
		return {
			key: r.key,
			value: r.value as unknown,
			version: r.version,
			updatedAt: r.updatedAt,
			updatedBy: r.updatedBy ?? null,
		}
	}

	async upsert(
		key: string,
		value: unknown,
		updatedBy?: string | null
	): Promise<GlobalSetting> {
		const r = await this.prisma.globalSetting.upsert({
			where: { key },
			update: {
				value: value as any,
				version: { increment: 1 },
				updatedBy: updatedBy ?? null,
			},
			create: { key, value: value as any, updatedBy: updatedBy ?? null },
		})
		return {
			key: r.key,
			value: r.value as unknown,
			version: r.version,
			updatedAt: r.updatedAt,
			updatedBy: r.updatedBy ?? null,
		}
	}

	async remove(key: string): Promise<void> {
		await this.prisma.globalSetting.delete({ where: { key } }).catch(() => {})
	}
}
