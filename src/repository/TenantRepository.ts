import type { BusinessHours, Tenant } from '@/modules/web-api/@types/tenant'

export interface TenantCreateData {
	name: string
	cnpj: string
	phone: string
	site?: string | null
	email?: string | null
	description?: string | null
	businessHours?: BusinessHours | null
}

export interface TenantUpdateData {
	name: string
	cnpj: string
	phone: string
	site?: string | null
	email?: string | null
	description?: string | null
	businessHours?: BusinessHours | null
}

export interface TenantRepository {
	create(data: TenantCreateData): Promise<Tenant>
	update(id: string, data: TenantUpdateData): Promise<Tenant>
	upsert(id: string, data: TenantCreateData): Promise<Tenant>
	get(id: string): Promise<Tenant | null>
	getByCNPJ(cnpj: string): Promise<Tenant | null>
	list(): Promise<Tenant[]>
	remove(id: string): Promise<void>

	// Settings CRUD (AI/Meta tokens)
	getSettings(id: string): Promise<{
		aiTokenApi: string | null
		metaTokenApi: string | null
		agentInstruction: string | null
	}>
	updateSettings(
		id: string,
		data: {
			aiTokenApi?: string | null
			metaTokenApi?: string | null
			agentInstruction?: string | null
		}
	): Promise<{
		aiTokenApi: string | null
		metaTokenApi: string | null
		agentInstruction: string | null
	}>
}
