import OpenAI from 'openai'
import { VectorStoreManager } from './VectorStoreManager'
import { TenantOpenAIKeyMissingError } from './errors'
import type { TenantRepository } from '@/repository/TenantRepository'
import type { TenantVectorStoreRepository } from '@/repository/TenantVectorStoreRepository'

export class OpenAIClientRegistry {
	private clientByKey = new Map<string, OpenAI>()
	private vsmByKey = new Map<string, VectorStoreManager>()

	constructor(
		private readonly tenantRepo: TenantRepository,
		private readonly tenantVectorRepo: TenantVectorStoreRepository
	) {}

	private getOrCreateClient(apiKey: string): OpenAI {
		const key = apiKey
		let c = this.clientByKey.get(key)
		if (!c) {
			c = new OpenAI({ apiKey: key })
			this.clientByKey.set(key, c)
		}
		return c
	}

	private getOrCreateVSM(apiKey: string): VectorStoreManager {
		const key = apiKey
		let v = this.vsmByKey.get(key)
		if (!v) {
			const client = this.getOrCreateClient(key)
			v = new VectorStoreManager(client, this.tenantVectorRepo)
			this.vsmByKey.set(key, v)
		}
		return v
	}

	async getClientForTenant(tenantId: string): Promise<OpenAI> {
		const { aiTokenApi } = await this.tenantRepo.getSettings(tenantId)

		if (!aiTokenApi) {
			throw new TenantOpenAIKeyMissingError(tenantId)
		}

		return this.getOrCreateClient(aiTokenApi)
	}

	async getVectorStoreManagerForTenant(
		tenantId: string
	): Promise<VectorStoreManager> {
		const { aiTokenApi } = await this.tenantRepo.getSettings(tenantId)

		if (!aiTokenApi) {
			throw new TenantOpenAIKeyMissingError(tenantId)
		}

		return this.getOrCreateVSM(aiTokenApi)
	}
}
