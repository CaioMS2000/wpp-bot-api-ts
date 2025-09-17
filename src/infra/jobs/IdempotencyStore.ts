export interface IdempotencyStore {
	seen(key: string): Promise<boolean>
	mark(key: string, ttlMs: number): Promise<void>
}
