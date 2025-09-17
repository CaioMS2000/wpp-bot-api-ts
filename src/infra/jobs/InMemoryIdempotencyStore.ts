import type { IdempotencyStore } from './IdempotencyStore'

export class InMemoryIdempotencyStore implements IdempotencyStore {
	private map = new Map<string, number>()
	private sweepInterval: NodeJS.Timeout

	constructor(private readonly sweepMs = 60_000) {
		this.sweepInterval = setInterval(() => this.sweep(), sweepMs)
		this.sweepInterval.unref()
	}

	async seen(key: string): Promise<boolean> {
		const now = Date.now()
		const until = this.map.get(key)
		if (!until) return false
		if (until < now) {
			this.map.delete(key)
			return false
		}
		return true
	}

	async mark(key: string, ttlMs: number): Promise<void> {
		const until = Date.now() + Math.max(1_000, ttlMs)
		this.map.set(key, until)
	}

	private sweep() {
		const now = Date.now()
		for (const [k, v] of this.map.entries()) if (v < now) this.map.delete(k)
	}
}
