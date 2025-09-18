export type GlobalSetting = {
	key: string
	value: unknown
	version: number
	updatedAt: Date
	updatedBy?: string | null
}

export interface GlobalConfigRepository {
	getAll(): Promise<GlobalSetting[]>
	get(key: string): Promise<GlobalSetting | null>
	upsert(
		key: string,
		value: unknown,
		updatedBy?: string | null
	): Promise<GlobalSetting>
	remove(key: string): Promise<void>
}
