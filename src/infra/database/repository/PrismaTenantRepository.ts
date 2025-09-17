import { BusinessHours, Tenant } from '@/modules/web-api/@types/tenant'
import type {
	TenantCreateData,
	TenantRepository,
	TenantUpdateData,
} from '@/repository/TenantRepository'
import type { PrismaClient } from '@prisma/client'
import { Prisma } from '@prisma/client'

export class PrismaTenantRepository implements TenantRepository {
	constructor(private readonly prisma: PrismaClient) {}

	private toTenant(model: any): Tenant {
		return {
			id: model.id,
			name: model.name,
			cnpj: model.cnpj,
			phone: model.phone,
			site: model.site ?? null,
			email: model.email ?? null,
			description: model.description ?? null,
			businessHours:
				typeof model.businessHours === 'object' && model.businessHours !== null
					? (model.businessHours as unknown as BusinessHours)
					: null,
			aiTokenApi: model.aiTokenApi ?? null,
			metaTokenApi: model.metaTokenApi ?? null,
			createdAt: model.createdAt,
			updatedAt: model.updatedAt,
		}
	}

	async create(data: TenantCreateData): Promise<Tenant> {
		const row = await this.prisma.tenant.create({
			data: {
				name: data.name,
				cnpj: data.cnpj,
				phone: data.phone,
				site: data.site ?? null,
				email: data.email ?? null,
				description: data.description ?? null,
				businessHours:
					data.businessHours === null || data.businessHours === undefined
						? Prisma.DbNull
						: (data.businessHours as unknown as Prisma.InputJsonValue),
			},
		})
		return this.toTenant(row)
	}

	async update(id: string, data: TenantUpdateData): Promise<Tenant> {
		const row = await this.prisma.tenant.update({
			where: { id },
			data: {
				name: data.name,
				cnpj: data.cnpj,
				phone: data.phone,
				site: data.site ?? null,
				email: data.email ?? null,
				description: data.description ?? null,
				businessHours:
					data.businessHours === null || data.businessHours === undefined
						? Prisma.DbNull
						: (data.businessHours as unknown as Prisma.InputJsonValue),
			},
		})
		return this.toTenant(row)
	}

	async upsert(id: string, data: TenantCreateData): Promise<Tenant> {
		const row = await this.prisma.tenant.upsert({
			where: { id },
			update: {
				name: data.name,
				phone: data.phone,
				cnpj: data.cnpj,
				site: data.site ?? null,
				email: data.email ?? null,
				description: data.description ?? null,
				businessHours:
					data.businessHours === null || data.businessHours === undefined
						? Prisma.DbNull
						: (data.businessHours as unknown as Prisma.InputJsonValue),
			},
			create: {
				id,
				name: data.name,
				cnpj: data.cnpj,
				phone: data.phone,
				site: data.site ?? null,
				email: data.email ?? null,
				description: data.description ?? null,
				businessHours:
					data.businessHours === null || data.businessHours === undefined
						? Prisma.DbNull
						: (data.businessHours as unknown as Prisma.InputJsonValue),
			},
		})
		return this.toTenant(row)
	}

	async get(id: string): Promise<Tenant | null> {
		const row = await this.prisma.tenant.findUnique({ where: { id } })
		return row ? this.toTenant(row) : null
	}

	async getByCNPJ(cnpj: string): Promise<Tenant | null> {
		const row = await this.prisma.tenant.findUnique({ where: { cnpj } })
		return row ? this.toTenant(row) : null
	}

	async list(): Promise<Tenant[]> {
		const rows = await this.prisma.tenant.findMany({
			orderBy: { createdAt: 'desc' },
		})
		return rows.map(r => this.toTenant(r))
	}

	async remove(id: string): Promise<void> {
		await this.prisma.tenant.delete({ where: { id } })
	}

	async getSettings(id: string): Promise<{
		aiTokenApi: string | null
		metaTokenApi: string | null
		agentInstruction: string | null
	}> {
		const row = await this.prisma.tenant.findUnique({
			where: { id },
			select: { aiTokenApi: true, metaTokenApi: true, agentInstruction: true },
		})
		return {
			aiTokenApi: row?.aiTokenApi ?? null,
			metaTokenApi: row?.metaTokenApi ?? null,
			agentInstruction: row?.agentInstruction ?? null,
		}
	}

	async updateSettings(
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
	}> {
		const updateData: Record<string, string | null | undefined> = {}
		if (Object.prototype.hasOwnProperty.call(data, 'aiTokenApi')) {
			updateData.aiTokenApi = data.aiTokenApi ?? null
		}
		if (Object.prototype.hasOwnProperty.call(data, 'metaTokenApi')) {
			updateData.metaTokenApi = data.metaTokenApi ?? null
		}
		if (Object.prototype.hasOwnProperty.call(data, 'agentInstruction')) {
			updateData.agentInstruction = data.agentInstruction ?? null
		}
		const row = await this.prisma.tenant.update({
			where: { id },
			data: updateData,
			select: { aiTokenApi: true, metaTokenApi: true, agentInstruction: true },
		})
		return {
			aiTokenApi: row.aiTokenApi ?? null,
			metaTokenApi: row.metaTokenApi ?? null,
			agentInstruction: row.agentInstruction ?? null,
		}
	}
}
