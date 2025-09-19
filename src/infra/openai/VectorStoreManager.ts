import { logger } from '@/infra/logging/logger'
import type { TenantVectorStoreRepository } from '@/repository/TenantVectorStoreRepository'
import OpenAI from 'openai'

export class VectorStoreManager {
	constructor(
		private client: OpenAI,
		private repo: TenantVectorStoreRepository
	) {}

	/** Ensures a vector store exists for a tenant and returns its ID */
	async ensureVectorStoreForTenant(tenantId: string): Promise<string> {
		const existing = await this.repo.findByTenant(tenantId)
		if (existing) {
			const ok = await this.validate(existing.vectorStoreId)
			if (ok) return existing.vectorStoreId
			// recreate mapping if stale
			const vs2 = await this.client.vectorStores.create({
				name: `tenant:${tenantId}`,
				metadata: { tenantId },
			})
			await this.repo.upsert(tenantId, vs2.id)
			return vs2.id
		}

		const vs = await this.client.vectorStores.create({
			name: `tenant:${tenantId}`,
			metadata: { tenantId },
		})
		await this.repo.upsert(tenantId, vs.id)
		return vs.id
	}

	/** Force-create a new store and update mapping (used when API reports missing store) */
	async repairVectorStoreForTenant(tenantId: string): Promise<string> {
		const vs = await this.client.vectorStores.create({
			name: `tenant:${tenantId}`,
			metadata: { tenantId },
		})
		await this.repo.upsert(tenantId, vs.id)
		return vs.id
	}

	private async validate(id: string): Promise<boolean> {
		try {
			await this.client.vectorStores.retrieve(id)
			return true
		} catch (err: any) {
			// treat 404 as invalid; other errors let caller decide
			logger.error('vector_store_validate_failed', {
				component: 'VectorStoreManager',
				id,
				err,
			})
			if (err?.status === 404) return false
			return true
		}
	}
}
