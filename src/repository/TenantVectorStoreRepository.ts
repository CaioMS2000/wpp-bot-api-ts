export type TenantVectorStoreRecord = {
	tenantId: string
	vectorStoreId: string
}

export interface TenantVectorStoreRepository {
	findByTenant(tenantId: string): Promise<TenantVectorStoreRecord | null>
	upsert(
		tenantId: string,
		vectorStoreId: string
	): Promise<TenantVectorStoreRecord>
}
