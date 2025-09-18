import type { GlobalConfigRepository } from '@/repository/GlobalConfigRepository'

type CacheEntry = { value: unknown; version: number; updatedAt: number }

export class GlobalConfigService {
	private cache = new Map<string, CacheEntry>()
	private lastFullRefresh = 0
	private readonly refreshIntervalMs: number

	constructor(
		private readonly repo: GlobalConfigRepository,
		opts?: { refreshIntervalMs?: number }
	) {
		this.refreshIntervalMs = opts?.refreshIntervalMs ?? 30_000
		// Best-effort background refresh; won't crash app if fails
		setInterval(() => {
			this.refreshAll().catch(() => {})
		}, this.refreshIntervalMs).unref()
	}

	async refreshAll(): Promise<void> {
		const now = Date.now()
		if (now - this.lastFullRefresh < this.refreshIntervalMs / 2) return
		const rows = await this.repo.getAll()
		for (const r of rows) {
			this.cache.set(r.key, {
				value: r.value,
				version: r.version,
				updatedAt: r.updatedAt.getTime(),
			})
		}
		this.lastFullRefresh = now
	}

	private async ensureFresh(): Promise<void> {
		if (Date.now() - this.lastFullRefresh > this.refreshIntervalMs) {
			await this.refreshAll()
		}
	}

	// Generic get
	async get<T = unknown>(key: string, fallback?: T): Promise<T> {
		await this.ensureFresh()
		const hit = this.cache.get(key)
		if (hit !== undefined) return hit.value as T
		// Lazy load single key if not in cache
		const row = await this.repo.get(key)
		if (row) {
			this.cache.set(key, {
				value: row.value,
				version: row.version,
				updatedAt: row.updatedAt.getTime(),
			})
			return row.value as T
		}
		return fallback as T
	}

	async set<T = unknown>(key: string, value: T, updatedBy?: string | null) {
		const saved = await this.repo.upsert(key, value, updatedBy)
		this.cache.set(key, {
			value: saved.value,
			version: saved.version,
			updatedAt: saved.updatedAt.getTime(),
		})
		return saved
	}

	async remove(key: string) {
		await this.repo.remove(key)
		this.cache.delete(key)
	}

	// Convenience typed getters
	async getBoolean(key: string, fallback = false): Promise<boolean> {
		const v = await this.get<unknown>(key)
		if (typeof v === 'boolean') return v
		if (typeof v === 'string') return v.toLowerCase() === 'true'
		if (typeof v === 'number') return v !== 0
		return fallback
	}

	async getNumber(key: string, fallback = 0): Promise<number> {
		const v = await this.get<unknown>(key)
		if (typeof v === 'number') return v
		if (typeof v === 'string') {
			const n = Number(v)
			return Number.isFinite(n) ? n : fallback
		}
		return fallback
	}

	async getString(key: string, fallback = ''): Promise<string> {
		const v = await this.get<unknown>(key)
		if (typeof v === 'string') return v
		if (v == null) return fallback
		return JSON.stringify(v)
	}
}
