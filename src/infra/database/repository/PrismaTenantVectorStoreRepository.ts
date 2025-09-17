import { TenantVectorStoreRepository } from '@/repository/TenantVectorStoreRepository'
import type { PrismaClient } from '@prisma/client'

export type TenantVectorStoreRecord = {
	tenantId: string
	vectorStoreId: string
}

export class PrismaTenantVectorStoreRepository
	implements TenantVectorStoreRepository
{
	constructor(private prisma: PrismaClient) {}

	async findByTenant(
		tenantId: string
	): Promise<TenantVectorStoreRecord | null> {
		const rec = await this.prisma.tenantVectorStore.findUnique({
			where: { tenantId },
		})
		if (!rec) return null
		return { tenantId: rec.tenantId, vectorStoreId: rec.vectorStoreId }
	}

	async upsert(
		tenantId: string,
		vectorStoreId: string
	): Promise<TenantVectorStoreRecord> {
		const rec = await this.prisma.tenantVectorStore.upsert({
			where: { tenantId },
			create: { tenantId, vectorStoreId },
			update: { vectorStoreId },
		})
		return { tenantId: rec.tenantId, vectorStoreId: rec.vectorStoreId }
	}
}
