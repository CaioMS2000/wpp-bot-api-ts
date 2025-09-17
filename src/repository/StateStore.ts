export type StateSnapshot = {
	state: string
	data?: unknown
	version: number
	aiSessionId?: string | null
}

export interface StateStore {
	load(tenantId: string, phone: string): Promise<StateSnapshot | null>
	save(
		tenantId: string,
		phone: string,
		state: string,
		data?: unknown,
		aiSessionId?: string | null
	): Promise<StateSnapshot>
	clear(tenantId: string, phone: string): Promise<void>
}
